# Weather Agent Chat Client

This is a Next.js application that provides a chat interface for interacting with a weather agent powered by Mastra.

## Prerequisites

Before running this client, make sure you have the agent-server running. Navigate to the `../agent-server` directory and start it:

```bash
cd ../agent-server
npm run dev
```

The agent-server will typically run on `http://localhost:4200`.

## Environment Setup

Create a `.env.local` file in the root directory with the following content:

```bash
MASTRA_API_URL=https://agent-server-nine.vercel.app
```

**Note**: This environment variable is used server-side only (no `NEXT_PUBLIC_` prefix needed) since we use Next.js API routes as a proxy to the Mastra agent server. This architecture:
- Avoids CORS issues
- Keeps agent communication server-to-server
- Enables future authentication integration
- Provides better security

Adjust the URL if your agent-server runs on a different port. If you don't create this file, the API will default to `http://localhost:4200`.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the weather agent chat interface.

## Architecture

This application follows a secure server-to-server architecture:

```
Client (Browser) → Next.js API Routes → Mastra Agent Server
```

- **Client**: React-based chat interface
- **Next.js API Routes**: Proxy layer handling authentication and agent communication
- **Mastra Agent Server**: Backend AI agent service

This design eliminates CORS issues, enables authentication, and maintains security best practices.

## Features

- Real-time chat interface with a weather agent
- Ask about weather conditions in any location
- Get activity suggestions based on weather
- Responsive design with a clean, modern UI
- Server-to-server architecture for security and authentication readiness

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
