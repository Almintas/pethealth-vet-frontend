import type { ApolloClient } from '@apollo/client';
import {
  LOGIN_MUTATION,
  ME_QUERY,
  REGISTER_VETERINARIAN_MUTATION,
} from './graphql';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from './token-storage';
import type {
  AuthPayload,
  AuthUser,
  LoginInput,
  RegisterVeterinarianInput,
} from './types';

type LoginMutationResult = {
  login: AuthPayload;
};

type MeQueryResult = {
  me: AuthUser;
};

export { getAccessToken };

export async function login(
  client: ApolloClient,
  input: LoginInput,
): Promise<AuthUser> {
  const { data } = await client.mutate<LoginMutationResult>({
    mutation: LOGIN_MUTATION,
    variables: { input },
  });

  const payload = data?.login;
  if (!payload?.accessToken) {
    throw new Error('Login failed: missing authentication payload.');
  }

  setAccessToken(payload.accessToken);

  const user = await fetchCurrentUser(client);
  if (!user) {
    throw new Error('Login failed: could not load your profile.');
  }

  return user;
}

export async function registerVeterinarian(
  client: ApolloClient,
  input: RegisterVeterinarianInput,
): Promise<AuthUser> {
  await client.mutate({
    mutation: REGISTER_VETERINARIAN_MUTATION,
    variables: { input },
  });

  return login(client, {
    email: input.email,
    password: input.password,
  });
}

export async function fetchCurrentUser(
  client: ApolloClient,
): Promise<AuthUser | null> {
  if (!getAccessToken()) {
    return null;
  }

  try {
    const { data, error } = await client.query<MeQueryResult>({
      query: ME_QUERY,
      fetchPolicy: 'network-only',
    });

    if (error || !data?.me) {
      clearAccessToken();
      return null;
    }

    return data.me;
  } catch {
    clearAccessToken();
    return null;
  }
}

export async function logout(client: ApolloClient): Promise<void> {
  clearAccessToken();
  await client.clearStore();
}

export function syncAuthUserCache(
  client: ApolloClient,
  user: AuthUser,
): void {
  client.writeQuery<MeQueryResult>({
    query: ME_QUERY,
    data: { me: user },
  });
}
