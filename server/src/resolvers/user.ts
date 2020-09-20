import argon2 from 'argon2';
import { MyContext } from 'src/types';
import { Arg, Ctx, FieldResolver, Mutation, Query, Resolver, Root } from 'type-graphql';
import { getConnection } from 'typeorm';
import { v4 } from 'uuid';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { User } from '../entities/User';
import { sendEmail } from '../utils/sendEmail';
import { validateRegister } from '../utils/validateRegister';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import { UserResponse } from './UserResponse';

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      // this is the current user and it is OK to show them
      // their own email
      return user.email;
    }

    // current user shouldn't see someone else's email
    return "";
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
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

    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);
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

    await User.update(
      { id: userIdNum },
      {
        password: await argon2.hash(newPassword),
      }
    );

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
    @Ctx() { redis }: MyContext
  ): Promise<boolean> {
    const user = await User.findOne({ where: { email } });
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
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    let response: UserResponse;
    const errors = validateRegister(options);
    if (errors) {
      response = { errors };
    } else {
      // succesfull registration
      const hashedpassword = await argon2.hash(options.password);
      let user: User;
      try {
        // User.create({}).save()
        const result = await getConnection()
          .createQueryBuilder()
          .insert()
          .into(User)
          .values({
            username: options.username,
            password: hashedpassword,
            email: options.email,
          })
          .returning("*")
          .execute();

        user = result.raw[0];
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
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    let response: UserResponse;
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
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
