import React, { useState } from 'react';
import { BiDislike, BiLike } from 'react-icons/bi';
import { Flex, IconButton } from '@chakra-ui/core';
import { PostSnippetFragment, useMeQuery, useVoteMutation } from '@src/generated/graphql';

interface Props {
  post: PostSnippetFragment;
}

export const VoteSection: React.FC<Props> = ({ post }) => {
  const [{ data: meData }] = useMeQuery();
  const [, vote] = useVoteMutation();
  const [votingState, setVotingState] = useState<
    "upvote-loading" | "downvote-loading" | "not-laoding"
  >("not-laoding");
  if (!meData?.me) {
    return null;
  }
  return (
    <Flex direction="column" justifyContent="center" alignItems="center" mr={4}>
      <IconButton
        as={BiLike}
        _hover={{ backgroundColor: "transparent" }}
        cursor="pointer"
        aria-label="Upvote post"
        backgroundColor="transparent"
        isLoading={votingState === "upvote-loading"}
        color={post.voteStatus === 1 ? "green.500" : "gray.400"}
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
        as={BiDislike}
        _hover={{ backgroundColor: "transparent" }}
        cursor="pointer"
        aria-label="Downvote post"
        backgroundColor="transparent"
        isLoading={votingState === "downvote-loading"}
        color={post.voteStatus === -1 ? "red.600" : "gray.400"}
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
