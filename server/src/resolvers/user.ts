import argon2 from 'argon2';
import { MyContext } from 'src/types';
import { Arg, Ctx, Mutation, Query, Resolver } from 'type-graphql';
import { v4 } from 'uuid';
import { EntityManager } from '@mikro-orm/postgresql';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { User } from '../entities/User';
import { sendEmail } from '../utils/sendEmail';
import { validateRegister } from '../utils/validateRegister';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { UserResponse } from './UserResponse';

@Resolver()
export class UserResolver {
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, em, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2",
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const user = await em.findOne(User, { id: parseInt(userId) });
    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    user.password = await argon2.hash(newPassword);
    await em.persistAndFlush(user);

    // reomve the key from redis db so that the token could not be re-used again
    // to change the password
    await redis.del(key);

    // log in user after change password
    req.session.userId = user.id;
    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em, redis }: MyContext
  ): Promise<boolean> {
    const user = await em.findOne(User, { email });
    if (!user) {
      // email is not in the database
      return true;
    }

    // store the forget-password token in redis db
    const token = v4();
    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    const html = `<a href="http://localhost:3000/change-password/${token}">reset password</a>`;
    await sendEmail(email, html);
    return true;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }

    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    let response: UserResponse;
    const errors = validateRegister(options);
    if (errors) {
      response = { errors };
    } else {
      // succesfull registration
      const hashedpassword = await argon2.hash(options.password);

      try {
        const [user] = await (em as EntityManager)
          .createQueryBuilder(User)
          .getKnexQuery()
          .insert({
            username: options.username,
            password: hashedpassword,
            email: options.email,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .returning("*"); // return all user fields

        response = {
          user,
        };

        // set the session for a registred user
        // this will set a cookie on the user browser
        // keep them loggedin
        req.session.userId = user.id;
      } catch (err) {
        if (err.code === "23505") {
          // duplicate username error
          response = {
            errors: [
              {
                field: "username",
                message: "username already exist",
              },
            ],
          };
        } else {
          // uknown error
          response = {
            errors: [
              {
                field: "username",
                message: err.message,
              },
            ],
          };
        }
      }
    }

    return response;
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    let response: UserResponse;
    const user = (await em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    )) as User;
    if (!user) {
      // No user was found
      // Build no user found error object
      response = {
        errors: [
          {
            field: "usernameOrEmail",
            message: "username or email doens't exist",
          },
        ],
      };
    } else {
      const valid = await argon2.verify(user.password, password);
      if (!valid) {
        // Password is incorrect
        // Build incorrect password message
        response = {
          errors: [
            {
              field: "password",
              message: "incorrect password",
            },
          ],
        };
      } else {
        req.session.userId = user.id;
        // Password is correct
        // return found user in the response
        response = {
          user,
        };
      }
    }

    return response;
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.error(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }
}
