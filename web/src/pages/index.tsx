import { withUrqlClient } from 'next-urql';
import NextLink from 'next/link';
import React from 'react';
import { Box, Button, Flex, Heading, Link, Stack, Text } from '@chakra-ui/core';
import { Layout } from '@src/components/Layout';
import { usePostsQuery } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const Index = () => {
  const [{ data, fetching }] = usePostsQuery({
    variables: {
      limit: 100,
    },
  });

  let body: JSX.Element;

  if (!fetching && !data) {
    body = <Box>Ooops!</Box>;
  } else {
    body = (
      <Layout>
        <Flex align="center">
          <Heading>LeetHub</Heading>
          <NextLink href="/create-post">
            <Link ml="auto">Create post</Link>
          </NextLink>
        </Flex>
        <br />
        {fetching && !data ? (
          <Box>Loading...</Box>
        ) : (
          <Stack spacing={8}>
            {data!.posts.map((post) => (
              <Box key={post.id} p={5} shadow="md" borderWidth="1px">
                <Heading fontSize="xl">{post.title}</Heading>
                <Text mt={4}>{post.textSnippet}</Text>
              </Box>
            ))}
          </Stack>
        )}

        {data && (
          <Flex>
            <Button isLoading={fetching} m="auto" my={8}>
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
