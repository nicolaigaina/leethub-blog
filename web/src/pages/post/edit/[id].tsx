import { Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import React from 'react';
import { Box, Button, Heading } from '@chakra-ui/core';
import { InputField } from '@src/components/InputField';
import { Layout } from '@src/components/Layout';
import { usePostQuery, useUpdatePostMutation } from '@src/generated/graphql';
import { useGetIntId } from '@src/utils/useGetIntId';
import { withApollo } from '@src/utils/withApollo';

const EditPost: React.FC = () => {
  const router = useRouter();
  const intId = useGetIntId();
  const { data, loading } = usePostQuery({
    skip: intId === -1,
    variables: {
      id: intId,
    },
  });
  const [updatePost] = useUpdatePostMutation();

  if (loading) {
    return (
      <Layout>
        <Box>loading...</Box>
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
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values) => {
          await updatePost({
            variables: {
              id: intId,
              ...values,
            },
          });
          router.back();
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="title..." label="Title" />
            <Box marginTop={4}>
              <InputField
                textarea
                name="text"
                placeholder="text..."
                label="Body"
                type="text"
              />
            </Box>
            <Button
              marginTop={4}
              isLoading={isSubmitting}
              type="submit"
              variantColor="teal"
            >
              Update post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withApollo({ ssr: false })(EditPost);
