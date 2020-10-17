import gql from 'graphql-tag';
import Router from 'next/router';
import { dedupExchange, Exchange, fetchExchange, stringifyVariables } from 'urql';
import { pipe, tap } from 'wonka';
import { Cache, cacheExchange, Resolver } from '@urql/exchange-graphcache';
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables
} from '../generated/graphql';
import { isServer } from './isServer';
import updateQueryHelper from './updateQueryHelper';

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    const allFields = cache.inspectFields(entityKey);

    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    let hasMore = true;
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isInCache = cache.resolve(
      cache.resolveFieldByKey(entityKey, fieldKey) as string,
      "posts"
    );
    // Collect the cache query results of paginanted queries into a big results array
    // Check if the data is in the cache and return the array
    info.partial = !isInCache;
    const results: string[] = [];
    fieldInfos.forEach(({ fieldKey }) => {
      const key = cache.resolveFieldByKey(entityKey, fieldKey) as string;
      const posts = cache.resolve(key, "posts") as string[];
      const _hasMore = cache.resolve(key, "hasMore");
      if (!_hasMore) {
        hasMore = _hasMore as boolean;
      }
      results.push(...posts);
    });

    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results,
    };
  };
};

// A global exchange that allows us to catch global errors
const errorExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error) {
        if (error?.message.includes("not authenticated")) {
          Router.replace("./login");
        }
      }
    })
  );
};

// Config for when graphql mutations are cached. It configures
// fields that needs to be updated everytime mutations run.
const cacheExchangeConfig = {
  keys: {
    PaginatedPosts: () => null,
  },
  resolvers: {
    Query: {
      posts: cursorPagination(), // runs for when we're computing 'posts' from posts.graphql
    },
  },
  updates: {
    Mutation: {
      vote: (_result: any, _args: any, cache: Cache, _info: any) => {
        const { value, postId } = _args as VoteMutationVariables;
        const data = cache.readFragment(
          gql`
            fragment _ on Post {
              id
              points
              voteStatus
            }
          `,
          {
            id: postId,
          } as any
        );
        if (data) {
          if (data.voteStatus === value) {
            // if voteStatus is 1 and we are upvoting -> don't do anything and return
            return;
          }
          const newPoints =
            (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
          cache.writeFragment(
            gql`
              fragment __ on Post {
                points
                voteStatus
              }
            `,
            { id: postId, points: newPoints, voteStatus: value } as any
          );
        }
      },
      login: (_result: LoginMutation, _args: any, cache: Cache, _info: any) => {
        updateQueryHelper<LoginMutation, MeQuery>(
          cache,
          { query: MeDocument },
          _result,
          (result, query) => {
            if (result.login.errors) {
              return query;
            } else {
              return {
                me: result.login.user,
              };
            }
          }
        );
      },
      createPost: (_result: any, _args: any, cache: Cache, _info: any) => {
        const allFields = cache.inspectFields("Query");
        const fieldInfos = allFields.filter(
          (info) => info.fieldName === "posts"
        );
        fieldInfos.forEach((fieldInfo) => {
          cache.invalidate("Query", "posts", fieldInfo.arguments || {});
        });
      },
      logout: (
        _result: LogoutMutation,
        _args: any,
        cache: Cache,
        _info: any
      ) => {
        updateQueryHelper<LogoutMutation, MeQuery>(
          cache,
          { query: MeDocument },
          _result,
          () => ({ me: null })
        );
      },

      register: (
        _result: LoginMutation,
        _args: any,
        cache: Cache,
        _info: any
      ) => {
        updateQueryHelper<RegisterMutation, MeQuery>(
          cache,
          { query: MeDocument },
          _result,
          (result, query) => {
            if (result.register.errors) {
              return query;
            } else {
              return {
                me: result.register.user,
              };
            }
          }
        );
      },
    },
  },
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";

  if (isServer()) {
    cookie = ctx.req.headers.cookie;
  }

  return {
    url: "http://localhost:4000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    exchanges: [
      dedupExchange,
      cacheExchange(cacheExchangeConfig as any),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};
