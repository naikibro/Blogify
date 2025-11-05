import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  InitiateAuthCommand,
  GetUserCommand,
  AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const USER_POOL_ID = process.env.USER_POOL_ID || "";
const CLIENT_ID = process.env.USER_POOL_CLIENT_ID || "";

export interface CognitoUser {
  userId: string;
  email: string;
  role?: string;
}

export const createUser = async (
  email: string,
  password: string,
  role: string = "guest_author"
): Promise<CognitoUser> => {
  const attributes: AttributeType[] = [
    { Name: "email", Value: email },
    { Name: "email_verified", Value: "true" },
  ];

  const createCommand = new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    UserAttributes: attributes,
    MessageAction: "SUPPRESS",
  });

  const createResult = await cognitoClient.send(createCommand);

  if (!createResult.User?.Username) {
    throw new Error("Failed to create user");
  }

  // Set password
  const passwordCommand = new AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: email,
    Password: password,
    Permanent: true,
  });

  await cognitoClient.send(passwordCommand);

  return {
    userId: createResult.User.Username,
    email,
    role,
  };
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; idToken: string }> => {
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  const result = await cognitoClient.send(command);

  if (!result.AuthenticationResult) {
    throw new Error("Authentication failed");
  }

  return {
    accessToken: result.AuthenticationResult.AccessToken || "",
    refreshToken: result.AuthenticationResult.RefreshToken || "",
    idToken: result.AuthenticationResult.IdToken || "",
  };
};

export const getUserFromToken = async (
  accessToken: string
): Promise<CognitoUser> => {
  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  const result = await cognitoClient.send(command);

  if (!result.Username) {
    throw new Error("Invalid token");
  }

  const email =
    result.UserAttributes?.find((attr) => attr.Name === "email")?.Value || "";
  const role =
    result.UserAttributes?.find((attr) => attr.Name === "custom:role")?.Value ||
    "guest_author";

  return {
    userId: result.Username,
    email,
    role,
  };
};
