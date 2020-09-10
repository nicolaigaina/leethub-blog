import 'reflect-metadata';
import { ApolloServer } from 'apollo-server-express';
import connectRedis from 'connect-redis';
import cors from 'cors';
import express from 'express';
import session from 'express-session';
import Redis from 'ioredis';
import { buildSchema } from 'type-graphql';
import { MikroORM } from '@mikro-orm/core';
import { __prod__, COOKIE_NAME } from './constants';
import microConfig from './mikro-orm.config';
import { HelloResolver } from './resolvers/hello';
import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';

const PORT = 4000;

const main = async () => {
  const RedisStore = connectRedis(session);
  const redis = new Redis();

  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  const app = express();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({ client: redis, disableTouch: true }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        secure: __prod__, // cookie only works in https
        sameSite: "lax", // csrf
      },
      saveUninitialized: false,
      secret: "somesecretkey",
      resave: false,
    })
  );

  const appolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res, redis }),
  });

  appolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(PORT, () => {
    console.info(`Server started on localhost:${PORT}`);
  });
};

main().catch((err) => {
  console.error(err);
});
