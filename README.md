# Blogify - Headless Blogging Platform

Serverless blogging platform built with AWS Lambda, DynamoDB, S3, and Cognito.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)
![Serverless](https://img.shields.io/badge/Serverless-Framework-orange?logo=serverless)
![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-FF9900?logo=aws-lambda)
![DynamoDB](https://img.shields.io/badge/AWS-DynamoDB-4053D6?logo=amazon-dynamodb)
![S3](https://img.shields.io/badge/AWS-S3-569A31?logo=amazon-s3)
![Cognito](https://img.shields.io/badge/AWS-Cognito-232F3E?logo=amazon-aws)

## Features

- User authentication with AWS Cognito
- Full CRUD operations for blog posts
- Media management via S3 presigned URLs
- Role-based access control (Admin, Editor, Guest Author)

## Prerequisites

- Node.js 20.x+
- Yarn
- AWS CLI configured
- Serverless Framework: `yarn global add serverless`

## Quick Start

```bash
# Install dependencies
yarn install

# Run backend locally
yarn dev:functions  # API at http://localhost:3000

# Run frontend locally
yarn dev:frontend  # Frontend at http://localhost:4000
```

**Frontend local API**: Create `frontend/.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:3000/dev`

## Deployment

```bash
yarn deploy:functions:dev   # Deploy to dev stage
yarn deploy:functions:prod  # Deploy to production
```

## API Documentation

```bash
cd functions && yarn docs:generate  # Generate openapi.yml
cd functions && yarn docs:serve     # View in Swagger UI
```

## Project Documentation

```bash
yarn dev:docs    # Start Docusaurus docs server
yarn build:docs  # Build documentation
```

Full documentation is available in the `documentation/` folder.

## Project Structure

```
├── functions/        # Serverless functions (Lambda handlers)
├── frontend/         # Next.js frontend
└── package.json      # Root workspace config
```

## AWS Architecture

The platform follows a serverless architecture pattern, where all components scale automatically and you only pay for what you use. Requests flow through API Gateway, which validates authentication via Cognito before routing to Lambda functions. Lambda functions interact with DynamoDB for structured data and generate presigned URLs for S3 media operations.

```mermaid
graph TB
    Client[Frontend/Client] -->|HTTPS| API[API Gateway]
    API -->|Auth| Cognito[Cognito User Pool]
    API -->|Routes| Lambda[Lambda Functions]

    Lambda -->|CRUD| UsersTable[(DynamoDB<br/>blogify-users)]
    Lambda -->|CRUD| PostsTable[(DynamoDB<br/>blogify-posts)]
    Lambda -->|Presigned URLs| S3[S3 Bucket<br/>blogify-media]

    Client -.->|Direct Upload/Download| S3

    style API fill:#FF9900,color:#fff
    style Lambda fill:#FF9900,color:#fff
    style Cognito fill:#232F3E,color:#fff
    style UsersTable fill:#4A90E2,color:#fff
    style PostsTable fill:#4A90E2,color:#fff
    style S3 fill:#569A31,color:#fff
```

**Components:**

- **API Gateway** - REST API endpoint with Cognito authorizers for protected routes
- **Cognito User Pool** - User authentication and authorization (email-based, password policies)
- **Lambda Functions** - Serverless handlers for auth, posts, and media operations
- **DynamoDB Tables** - `blogify-users-{stage}` (user metadata/roles), `blogify-posts-{stage}` (blog content with GSI on authorId)
- **S3 Bucket** - `blogify-media-{stage}` - Media storage with CORS enabled for direct client uploads/downloads
