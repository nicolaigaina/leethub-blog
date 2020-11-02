import NextLink from 'next/link';
import React from 'react';
import { Box, Button, Flex, Heading, Link, Spinner, Stack, Text } from '@chakra-ui/core';
import { Layout } from '@src/components/Layout';
import { UpdateDeletePostButtons } from '@src/components/UpdateDeletePostButtons';
import { VoteSection } from '@src/components/VoteSection';
import { withApollo } from '@src/utils/withApollo';
import { useMeQuery, usePostsQuery } from '../generated/graphql';

const Index = () => {
  const { data: meData } = useMeQuery();
  const { data, loading, fetchMore, variables } = usePostsQuery({
    variables: {
      limit: 15,
      cursor: null as null | string,
    },
    notifyOnNetworkStatusChange: true,
  });

  let body: JSX.Element;

  if (!loading && !data) {
    body = <Box>Ooops!</Box>;
  } else {
    body = (
      <Layout>
        {loading && !data ? (
          <Box>
            <Spinner />
          </Box>
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
                      {meData?.me?.id === post.authorId && (
                        <Box ml="auto">
                          <UpdateDeletePostButtons id={post.id} />
                        </Box>
                      )}
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
                fetchMore({
                  variables: {
                    limit: variables?.limit,
                    cursor:
                      data.posts.posts[data.posts.posts.length - 1].createdAt,
                  },
                })
              }
              isLoading={loading}
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

export default withApollo({ ssr: true })(Index);
