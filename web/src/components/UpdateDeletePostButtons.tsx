import NextLink from 'next/link';
import React from 'react';
import { Box, IconButton, Link } from '@chakra-ui/core';
import { useDeletePostMutation } from '@src/generated/graphql';

interface Props {
  id: number;
}

export const UpdateDeletePostButtons: React.FC<Props> = ({ id }) => {
  const [deletePost] = useDeletePostMutation();
  return (
    <Box>
      <NextLink href="/post/edit/[id]" as={`/post/edit/${id}`}>
        <IconButton as={Link} mr={4} icon="edit" aria-label="Edit Post" />
      </NextLink>
      <IconButton
        icon="delete"
        aria-label="Delete Post"
        onClick={() => {
          deletePost({
            variables: { id },
            update: (cache) => {
              cache.evict({ id: "Post:" + id });
            },
          });
        }}
      />
    </Box>
  );
};
