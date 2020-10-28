import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { createUserLoader, createVoteStatusLoader } from './utils/dataLoaders';

export type MyContext = {
  req: Request & { session: Express.Session };
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof createUserLoader>;
  voteStatusLoader: ReturnType<typeof createVoteStatusLoader>;
};
