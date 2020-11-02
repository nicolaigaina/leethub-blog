import { withUrqlClient } from "next-urql";
import React from "react";
import { Box, Heading, Spinner } from "@chakra-ui/core";
import { Layout } from "@src/components/Layout";
import { UpdateDeletePostButtons } from "@src/components/UpdateDeletePostButtons";
import { useMeQuery } from "@src/generated/graphql";
import { createUrqlClient } from "@src/utils/createUrqlClient";
import { useGetPostFromUrl } from "@src/utils/useGetPostFromUrl";

const Post = ({}) => {
  const [{ data, error, fetching }] = useGetPostFromUrl();
  const [{ data: meData }] = useMeQuery();

  if (fetching) {
    return (
      <Layout>
        <Box>
          <Spinner />
        </Box>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Box>{error.message}</Box>
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <Heading>Ooops! No post found...</Heading>
      </Layout>
    );
  }

  return (
    <Layout>
      <Heading mb={4}>{data.post.title}</Heading>
      <Box mb={4}>{data.post.text}</Box>
      {meData?.me?.id === data.post.authorId && (
        <UpdateDeletePostButtons id={data.post.id} />
      )}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Post);
