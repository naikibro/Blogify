# Blogify - Headless Blogging Platform

A serverless headless blogging platform built with AWS Lambda, DynamoDB, S3, and Cognito.

## Features

- **User Authentication**: Register and login with AWS Cognito User Pools
- **Blog Posts CRUD**: Create, read, update, and delete blog posts
- **Media Management**: Upload and retrieve media files via S3 presigned URLs
- **Role-Based Access Control**: Admin, Editor, and Guest Author roles

## Prerequisites

- Node.js 20.x or higher
- AWS CLI configured with appropriate credentials
- Serverless Framework installed globally: `npm install -g serverless`

## Installation

```bash
npm install
```

## Configuration

No additional configuration needed. Cognito User Pool and Client are automatically created during deployment.

## Development

Run locally with Serverless Offline:

```bash
npm run dev
```

## Deployment

Deploy to AWS:

```bash
# Deploy to dev stage
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## Testing

See [TESTING_PLAN.md](./TESTING_PLAN.md) for comprehensive testing procedures and test cases.

## API Documentation

The API is documented using OpenAPI (Swagger) specification.

### Generate OpenAPI Specification

```bash
npm run docs:generate
```

This generates an `openapi.yml` file with the complete API specification.

### View API Documentation

To view the interactive API documentation:

```bash
npm run docs:serve
```

This will start a local Swagger UI server where you can explore and test all API endpoints.

The OpenAPI specification is automatically generated from the `serverless.yml` configuration and includes:

- All API endpoints with descriptions
- Request/response schemas
- Authentication requirements
- Error responses
- Query parameters and path parameters

**Note**: The warnings about "unrecognized property 'documentation'" are expected and can be ignored. The plugin correctly processes the documentation despite these warnings.

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user (body: `{ email, password, role? }`)
- `POST /auth/login` - Login and get Cognito tokens (body: `{ email, password }`)
  - Returns: `{ accessToken, refreshToken, idToken, user }`

### Blog Posts

- `GET /posts` - List all posts (query params: `published=true`, `authorId=xxx`)
- `GET /posts/{id}` - Get a specific post
- `POST /posts` - Create a new post (requires Cognito auth token)
- `PUT /posts/{id}` - Update a post (requires Cognito auth token, must be owner or admin)
- `DELETE /posts/{id}` - Delete a post (requires Cognito auth token, must be owner or admin)

### Media

- `POST /media/upload` - Get presigned URL for uploading media (requires Cognito auth token)
- `GET /media/{key}` - Get presigned URL for downloading media

## Project Structure

```
.
├── src/
│   ├── handlers/       # Lambda function handlers
│   │   ├── auth.ts     # Authentication handlers
│   │   ├── posts.ts    # Blog post handlers
│   │   └── media.ts    # Media management handlers
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── serverless.yml      # Serverless Framework configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```

## AWS Resources

- **Cognito User Pool**: User authentication and authorization
- **DynamoDB Tables**:
  - `blogify-users-{stage}` - User metadata and roles
  - `blogify-posts-{stage}` - Blog posts
- **S3 Bucket**: `blogify-media-{stage}` - Media storage
- **Lambda Functions**: All API handlers
- **API Gateway**: REST API endpoints with Cognito authorizers

## License

ISC
