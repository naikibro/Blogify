# Getting Started

This guide will help you set up Blogify locally and start developing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.x or higher
- **Yarn** package manager
- **AWS CLI** configured with your credentials
- **Serverless Framework**: `yarn global add serverless`

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/naikibro/blogify.git
cd blogify
```

2. **Install dependencies**

```bash
yarn install
```

This will install dependencies for all workspaces (functions, frontend, and docs).

## Running Locally

### Backend (API)

Start the serverless offline server:

```bash
yarn dev:functions
```

The API will be available at `http://localhost:3000/dev`

### Frontend

Start the Next.js development server:

```bash
yarn dev:frontend
```

The frontend will be available at `http://localhost:4000`

**Note**: Create `frontend/.env.local` with:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/dev
```

Once you have deployed the functions, replace this URL with your functions gateway url

### Documentation

Start the Docusaurus development server:

```bash
yarn dev:docs
```

The documentation will be available at `http://localhost:3001`
