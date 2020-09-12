import { Form, Formik } from 'formik';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React from 'react';
import { Box, Button } from '@chakra-ui/core';
import { Layout } from '@src/components/Layout';
import { useCreatePostMutation } from '@src/generated/graphql';
import { useIsAuth } from '@src/utils/useIsAuth';
import { InputField } from '../components/InputField';
import { createUrqlClient } from '../utils/createUrqlClient';

const CreatePost: React.FC<{}> = ({}) => {
  const router = useRouter();
  const [, createPost] = useCreatePostMutation();

  useIsAuth();

  return (
    <Layout variant="small">
      <Formik
        initialValues={{ title: "", text: "" }}
        onSubmit={async (values) => {
          const { error } = await createPost({ input: values });
          if (!error) {
            router.push("/");
          }
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
              Create post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(CreatePost);
