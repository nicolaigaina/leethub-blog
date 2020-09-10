import { dedupExchange, fetchExchange } from 'urql';
import { Cache, cacheExchange } from '@urql/exchange-graphcache';
import {
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation
} from '../generated/graphql';
import updateQueryHelper from './updateQueryHelper';

// Config for when graphql mutations are cached. It configures
// fields that needs to be updated everytime mutations run.
const cacheExchangeConfig = {
  updates: {
    Mutation: {
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

export const createUrqlClient = (ssrExchange: any) => ({
  url: "http://localhost:4000/graphql",
  fetchOptions: {
    credentials: "include" as const,
  },
  exchanges: [
    dedupExchange,
    cacheExchange(cacheExchangeConfig as any),
    ssrExchange,
    fetchExchange,
  ],
});
