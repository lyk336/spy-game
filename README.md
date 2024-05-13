This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Before Starting

In files 'src/app/page.tsx' and 'socket/index.js' change the 'baseSocketServerURL', 'socketServerPort' and 'websiteURL'(only inside 'socket/index.js') value to your actual URLs.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Then, run the server for socket.io:

```bash
npm run start:socket
# or
yarn start:socket
# or
pnpm run start:socket
# or
bun start:socket
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.
