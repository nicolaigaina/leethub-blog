import path from 'path';
import { MikroORM } from '@mikro-orm/core';
import { __prod__ } from './constants';
import { Post } from './entities/Post';
import { User } from './entities/User';

export default {
  entities: [Post, User],
  migrations: {
    path: path.join(__dirname, "./migrations"), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
  },
  dbName: "lireddit",
  user: "postgres",
  password: "postgres",
  debug: !__prod__,
  type: "postgresql",
} as Parameters<typeof MikroORM.init>[0];
