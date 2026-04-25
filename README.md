# Code Rangers Monorepo

Production-ready Turborepo scaffold containing a Next.js frontend, a decoupled modular Express backend with PostgreSQL & Prisma, Serverless architecture workers, and shared packages.

## Prerequisites

Before starting the application, ensure you have **Docker** and **Node Version Manager (`nvm`)** installed on your system.

## Quick Setup Guide

Follow these sequential steps in your terminal to easily boot up the entire full-stack application:

### 1. Setup Node 24 Environment
This repository requires Node.js v24 for strict ECMAScript Module support.
```bash
nvm install 24
nvm use 24
corepack enable
```

### 2. Start PostgreSQL Database
We rely on Docker for the fastest, most reliable local database initialization.
```bash
docker compose up -d
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Setup Prisma (Database Schema)
Generate the locally-typed Prisma client and sync your database via migrations:
```bash
npx prisma generate
cd apps/api
npx prisma generate
npx prisma migrate dev
cd ../..
```

### 5. Run the Application
Finally, use Turborepo to seamlessly build and run the frontend (`web`), backend (`api`), and other services concurrently:
```bash
pnpm run dev
```

### Endpoints
* **Frontend UI (Next.js)**: [http://localhost:3000](http://localhost:3000)
* **Backend API (Express)**: [http://localhost:4000](http://localhost:4000)

---
#### Need AWS Serverless? ☁️
This template includes an optional Serverless workspace. To scaffold AWS features (SQS, Lambda, DynamoDB), navigate to `apps/serverless` and execute `serverless deploy`.
