import type { ApolloClient } from '@apollo/client';
import {
  LOGIN_MUTATION,
  ME_QUERY,
  REGISTER_VETERINARIAN_MUTATION,
  REGISTER_WITH_INVITATION_MUTATION,
  VERIFY_TWO_FACTOR_LOGIN_MUTATION,
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
  LoginResult,
  RegisterVeterinarianInput,
  RegisterWithInvitationInput,
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
): Promise<LoginResult> {
  const { data } = await client.mutate<LoginMutationResult>({
    mutation: LOGIN_MUTATION,
    variables: { input },
  });

  const payload = data?.login;
  if (payload?.twoFactorRequired && payload.twoFactorToken) {
    return { status: 'two-factor-required', twoFactorToken: payload.twoFactorToken };
  }
  if (!payload?.accessToken) {
    throw new Error('Login failed: missing authentication payload.');
  }

  return { status: 'signed-in', user: await startSession(client, payload.accessToken) };
}

/** Second sign-in step: authenticator or recovery code. */
export async function verifyTwoFactorLogin(
  client: ApolloClient,
  twoFactorToken: string,
  code: string,
): Promise<AuthUser> {
  const { data } = await client.mutate<{
    verifyTwoFactorLogin: { accessToken: string | null };
  }>({
    mutation: VERIFY_TWO_FACTOR_LOGIN_MUTATION,
    variables: { input: { twoFactorToken, code } },
  });
  const accessToken = data?.verifyTwoFactorLogin?.accessToken;
  if (!accessToken) {
    throw new Error('Login failed: missing authentication payload.');
  }
  return startSession(client, accessToken);
}

async function startSession(
  client: ApolloClient,
  accessToken: string,
): Promise<AuthUser> {
  setAccessToken(accessToken);
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

  const result = await login(client, {
    email: input.email,
    password: input.password,
  });
  if (result.status !== 'signed-in') {
    throw new Error('Login failed: unexpected two-factor step.');
  }
  return result.user;
}

/** Creates an account from a clinic invitation, joins the clinic and signs in. */
export async function registerWithInvitation(
  client: ApolloClient,
  input: RegisterWithInvitationInput,
): Promise<AuthUser> {
  const { data } = await client.mutate<{
    registerWithInvitation: { accessToken: string };
  }>({
    mutation: REGISTER_WITH_INVITATION_MUTATION,
    variables: { input },
  });

  const accessToken = data?.registerWithInvitation?.accessToken;
  if (!accessToken) {
    throw new Error('Registration failed: missing authentication payload.');
  }
  setAccessToken(accessToken);

  const user = await fetchCurrentUser(client);
  if (!user) {
    throw new Error('Registration failed: could not load your profile.');
  }
  return user;
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
