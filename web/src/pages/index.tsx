import { withUrqlClient } from "next-urql";
import NextLink from "next/link";
import React, { useState } from "react";
import { Box, Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/core";
import { Layout } from "@src/components/Layout";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as null | string,
  });
  const [{ data, fetching }] = usePostsQuery({
    variables,
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
            {data!.posts.posts.map((post) => (
              <Box key={post.id} p={5} shadow="md" borderWidth="1px">
                <Heading fontSize="xl">{post.title}</Heading>{" "}
                <Text>posted by @{post.author.username}</Text>
                <Text mt={4}>{post.textSnippet}</Text>
              </Box>
            ))}
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
