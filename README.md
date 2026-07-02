# Investor Interest + Notification System

Built with Bun, Express.js, TypeScript, PostgreSQL (Prisma), Redis, and Socket.IO.

## Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com)

## Setup

**1. Clone and install**

```bash
git clone <repo-url>
cd backend-task
bun install
```

**2. Set environment variables**

Create a `.env` file:

```env
DATABASE_URL="postgresql://app:app@localhost:5432/app"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-here"
```

**3. Start PostgreSQL and Redis**

```bash
docker compose up -d
```

**4. Run migrations and generate Prisma client**

```bash
bunx prisma migrate deploy
bunx prisma generate
```

**5. Start the server**

```bash
bun run dev
```

Server runs on `http://localhost:3000`

---

## API Reference

### Auth

#### Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "investor@example.com", "password": "secret123", "role": "investor"}'
```

```json
{ "token": "<jwt>" }
```

> `role` is either `"investor"` or `"founder"`. Defaults to `"investor"`.

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "investor@example.com", "password": "secret123"}'
```

```json
{ "token": "<jwt>" }
```

---

### Interests

#### Express Interest

Requires JWT. Returns `409` if the same investor already expressed interest in the same startup.

```bash
curl -X POST http://localhost:3000/api/interests/express \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"startupId": "startup-123", "founderId": "<founder-user-id>"}'
```

```json
{
  "interest": {
    "id": "clx...",
    "investorId": "clx...",
    "startupId": "startup-123",
    "createdAt": "2026-07-02T13:00:00.000Z"
  }
}
```

---

### Notifications

#### Get Recent Notifications

Returns the 20 most recent notifications for the logged-in user.

```bash
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer <token>"
```

```json
{
  "notifications": [
    {
      "id": "clx...",
      "userId": "clx...",
      "message": "Investor investor@example.com expressed interest in your startup",
      "read": false,
      "createdAt": "2026-07-02T13:00:00.000Z"
    }
  ]
}
```

---

### Real-time (Socket.IO)

Founders connect with their `userId` as a query param to receive live notifications:

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  query: { userId: "<founder-user-id>" },
});

socket.on("new_interest", (notification) => {
  console.log("New interest:", notification);
});
```

When an investor expresses interest, the founder receives a `new_interest` event instantly.

---

## Project Structure

```
src/
  app.ts               # Server entry point
  lib/
    prisma.ts          # Prisma client
    redis.ts           # Redis pub/sub clients
  middleware/
    auth.ts            # JWT middleware
  routes/
    auth.ts            # Register / login
    interests.ts       # Express interest
    notifications.ts   # Get notifications
prisma/
  schema.prisma        # DB schema
docker-compose.yml     # PostgreSQL + Redis
```
