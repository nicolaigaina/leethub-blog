import React, { useState } from 'react';
import { Flex, IconButton } from '@chakra-ui/core';
import { PostSnippetFragment, useVoteMutation } from '@src/generated/graphql';

interface Props {
  post: PostSnippetFragment;
}

export const VoteSection: React.FC<Props> = ({ post }) => {
  const [, vote] = useVoteMutation();
  const [votingState, setVotingState] = useState<
    "upvote-loading" | "downvote-loading" | "not-laoding"
  >("not-laoding");
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        icon="chevron-up"
        aria-label="Upvote post"
        isLoading={votingState === "upvote-loading"}
        variantColor={post.voteStatus === 1 ? "green" : undefined}
        onClick={async () => {
          if (post.voteStatus === 1) {
            return;
          }
          setVotingState("upvote-loading");
          await vote({
            postId: post.id,
            value: 1,
          });
          setVotingState("not-laoding");
        }}
      />
      {post.points}
      <IconButton
        icon="chevron-down"
        aria-label="Downvote post"
        isLoading={votingState === "downvote-loading"}
        variantColor={post.voteStatus === -1 ? "red" : undefined}
        onClick={async () => {
          if (post.voteStatus === -1) {
            return;
          }
          setVotingState("downvote-loading");
          await vote({
            postId: post.id,
            value: -1,
          });
          setVotingState("not-laoding");
        }}
      />
    </Flex>
  );
};
