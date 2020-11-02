import React from 'react';
import { Box, Heading, Spinner } from '@chakra-ui/core';
import { Layout } from '@src/components/Layout';
import { UpdateDeletePostButtons } from '@src/components/UpdateDeletePostButtons';
import { useMeQuery } from '@src/generated/graphql';
import { useGetPostFromUrl } from '@src/utils/useGetPostFromUrl';
import { withApollo } from '@src/utils/withApollo';

const Post = ({}) => {
  const { data, error, loading } = useGetPostFromUrl();
  const { data: meData } = useMeQuery();

  if (loading) {
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

export default withApollo({ ssr: true })(Post);
