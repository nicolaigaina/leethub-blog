import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Link,
  Stack,
  Text
} from '@chakra-ui/core';
import { Layout } from '@src/components/Layout';
import { VoteSection } from '@src/components/VoteSection';
import { useDeletePostMutation, usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({
    variables,
  });

  const [, deletePost] = useDeletePostMutation();

  let body: JSX.Element;

  if (!fetching && !data) {
    body = <Box>Ooops!</Box>;
  } else {
    body = (
      <Layout>
        {fetching && !data ? (
          <Box>Loading...</Box>
        ) : (
          <Stack spacing={8}>
            {data!.posts.posts.map((post) =>
              !post ? null : (
                <Flex key={post.id} p={5} shadow="md" borderWidth="1px">
                  <VoteSection post={post} />
                  <Box flex={1}>
                    <NextLink href="/post/[id]" as={`/post/${post.id}`}>
                      <Link>
                        <Heading fontSize="xl">{post.title}</Heading>
                      </Link>
                    </NextLink>

                    <Text>posted by @{post.author.username}</Text>
                    <Flex align="center">
                      <Text flex={1} mt={4}>
                        {post.textSnippet}
                      </Text>
                      <IconButton
                        ml="auto"
                        variantColor="red"
                        icon="delete"
                        aria-label="Delete Post"
                        onClick={() => {
                          deletePost({ id: post.id });
                        }}
                      />
                    </Flex>
                  </Box>
                </Flex>
              )
            )}
          </Stack>
        )}

        {data && data.posts.hasMore && (
          <Flex>
            <Button
              onClick={() =>
                setVariables({
                  limit: variables.limit,
                  cursor:
                    data.posts.posts[data.posts.posts.length - 1].createdAt,
                })
              }
              isLoading={fetching}
              m="auto"
              my={8}
            >
              Load more
            </Button>
          </Flex>
        )}
      </Layout>
    );
  }

  return body;
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
