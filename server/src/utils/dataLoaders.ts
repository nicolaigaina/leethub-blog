import DataLoader from 'dataloader';
import { Updoot } from '../entities/Updoot';
import { User } from '../entities/User';

// [1, 44, 5, 77]
// [{1: id: 1, username: 'bob'},{44: id: 44, username: 'ben'},{5: id: 5, username: 'bob'}]
// returns an array of users
export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    const userIdToUser: Record<number, User> = {};
    users.forEach((u) => {
      userIdToUser[u.id] = u;
    });

    return userIds.map((userId) => userIdToUser[userId]);
  });

// [{postId: 3, userId: 4}]
// we load {postId: 3, userId: 4, value: 1}
// then we return [{postId: 3, userId: 4, value: 1}]
export const createVoteStatusLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any);
      const updootIdsToUpdoot: Record<string, Updoot> = {};
      updoots.forEach((u) => {
        updootIdsToUpdoot[`${u.userId}|${u.postId}`] = u;
      });

      return keys.map(
        (key) => updootIdsToUpdoot[`${key.userId}|${key.postId}`]
      );
    }
  );
