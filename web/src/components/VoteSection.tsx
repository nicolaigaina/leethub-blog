import gql from 'graphql-tag';
import React, { useState } from 'react';
import { BiDislike, BiLike } from 'react-icons/bi';
import { ApolloCache } from '@apollo/client';
import { Flex, IconButton } from '@chakra-ui/core';
import {
  PostSnippetFragment,
  useMeQuery,
  useVoteMutation,
  VoteMutation
} from '@src/generated/graphql';

interface Props {
  post: PostSnippetFragment;
}

const updateAfterVote = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  const data = cache.readFragment<{
    id: number;
    points: number;
    voteStatus: number | null;
  }>({
    id: "Post:" + postId,
    fragment: gql`
      fragment _ on Post {
        id
        points
        voteStatus
      }
    `,
  });
  if (data) {
    if (data.voteStatus === value) {
      // if voteStatus is 1 and we are upvoting -> don't do anything and return
      return;
    }
    const newPoints =
      (data.points as number) + (!data.voteStatus ? 1 : 2) * value;
    cache.writeFragment({
      id: "Post:" + postId,
      fragment: gql`
        fragment __ on Post {
          points
          voteStatus
        }
      `,
      data: { points: newPoints, voteStatus: value },
    });
  }
};

export const VoteSection: React.FC<Props> = ({ post }) => {
  const { data: meData } = useMeQuery();
  const [vote] = useVoteMutation();
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
            variables: {
              postId: post.id,
              value: 1,
            },
            update: (cache) => updateAfterVote(1, post.id, cache),
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
            variables: {
              postId: post.id,
              value: -1,
            },
            update: (cache) => updateAfterVote(-1, post.id, cache),
          });
          setVotingState("not-laoding");
        }}
      />
    </Flex>
  );
};
