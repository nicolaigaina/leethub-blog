import { NextPageContext } from 'next';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { PaginatedPosts } from '@src/generated/graphql';
import { createWithApollo } from './createWithApollo';

const createClient = (ctx: NextPageContext | undefined) =>
  new ApolloClient({
    uri: process.env.NEXT_PUBLIC_API_URL as string,
    credentials: "include",
    headers: {
      cookie:
        (typeof window === "undefined"
          ? ctx?.req?.headers.cookie
          : undefined) || "",
    },
    // https://www.apollographql.com/docs/react/caching/cache-field-behavior/#merging-arrays
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            posts: {
              keyArgs: [],
              merge(
                existing: PaginatedPosts | undefined,
                incoming: PaginatedPosts
              ): PaginatedPosts {
                return {
                  ...incoming,
                  posts: [...(existing?.posts || []), ...incoming.posts],
                };
              },
            },
          },
        },
      },
    }),
  });

export const withApollo = createWithApollo(createClient);
