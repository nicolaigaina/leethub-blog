import NextLink from 'next/link';
import React from 'react';
import { Box, Button, Flex, Link } from '@chakra-ui/core';
import { useLogoutMutation, useMeQuery } from '../generated/graphql';
import { isServer } from '../utils/isServer';

export const NavBar: React.FC = () => {
  const [{ data, fetching }] = useMeQuery({ pause: isServer() });
  const [{ fetching: logoutFetching }, logout] = useLogoutMutation();
  let body = null;

  const onClick = async () => await logout();

  // data is fetching
  if (fetching) {
    // user is not logged in
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={2}>Login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>Register</Link>
        </NextLink>
      </>
    );
    // user is logged in
  } else {
    body = (
      <Flex>
        <Box mr={2}>{data.me.username}</Box>
        <Button isLoading={logoutFetching} onClick={onClick} variant="link">
          Logout
        </Button>
      </Flex>
    );
  }

  return (
    <Flex zIndex={1} position="sticky" top={0} bg="tomato" p={4}>
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
