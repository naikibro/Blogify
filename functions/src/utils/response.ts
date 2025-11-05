import { APIGatewayProxyResult } from "aws-lambda";

export interface ErrorResponse {
  error: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  code?: string;
}

export const success = <T>(
  data: T,
  statusCode = 200
): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(data),
  };
};

export const error = (
  messageOrError: string | ErrorResponse | object,
  statusCode = 400
): APIGatewayProxyResult => {
  let errorResponse: ErrorResponse;

  if (typeof messageOrError === "string") {
    // Simple string error message
    errorResponse = {
      error: messageOrError,
    };
  } else if (
    typeof messageOrError === "object" &&
    messageOrError !== null &&
    "message" in messageOrError
  ) {
    // Structured error object
    errorResponse = messageOrError as ErrorResponse;
  } else {
    // Fallback for other object types
    errorResponse = {
      error: "An error occurred",
      ...(messageOrError as object),
    };
  }

  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(errorResponse),
  };
};
