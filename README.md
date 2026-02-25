# TeamConnect

A secure, multi-workspace team collaboration backend built with TypeScript, Express, PostgreSQL, and Prisma. Designed as a production-grade foundation for real-time team communication with workspace isolation, role-based access control, and a rotating JWT authentication strategy.

---

## Problem Statement

Existing team communication tools fall into two extremes: lightweight social messaging apps that lack structure for professional work, and heavyweight enterprise suites that are complex and expensive for small teams.

TeamConnect addresses this gap by providing a **backend-first collaboration platform** where:

- Workspaces isolate teams and their data at the query level
- Membership and permissions are enforced before any resource is accessed
- Conversations (private and group) are scoped to workspaces
- Authentication uses short-lived access tokens with secure, rotating refresh tokens

The architecture is designed to support real-time features (WebSockets) and AI-assisted productivity as future layers on top of a solid, secure backend.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Client (React)                      │
│         Vite · TypeScript · TailwindCSS · Zustand       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (REST)
┌──────────────────────▼──────────────────────────────────┐
│                  API Server (Express 5)                  │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │    Auth      │  │  Workspace   │  │ Conversations │  │
│  │  Controller  │  │  Controller  │  │  + Messages   │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬────────┘  │
│         │                │                  │           │
│  ┌──────▼──────────────────────────────────▼────────┐  │
│  │              Auth Middleware (JWT)                │  │
│  │         Bearer token verification on all         │  │
│  │            protected routes                      │  │
│  └──────────────────────┬───────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │            Prisma ORM (Query Layer)              │  │
│  │       Workspace-scoped queries enforce           │  │
│  │           multi-tenant isolation                 │  │
│  └──────────────────────┬───────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │
              ┌───────────▼────────────┐
              │   PostgreSQL (Docker)  │
              │   6 tables · enums ·   │
              │   composite keys       │
              └────────────────────────┘
```

---

## Security Model

### Authentication

| Mechanism | Detail |
|-----------|--------|
| **Access Token** | Short-lived JWT (Bearer), contains `userId`, `email`, `tokenVersion` |
| **Refresh Token** | Longer-lived JWT stored as HTTP-only secure cookie, scoped to `/api/auth/refresh` |
| **Token Rotation** | Every refresh issues a new refresh token and invalidates the previous one |
| **Token Hashing** | Refresh tokens are SHA-256 hashed before database storage |
| **Token Versioning** | `tokenVersion` on User model enables server-side session invalidation |
| **Cookie Security** | `httpOnly`, `secure` (production), `sameSite: lax` |

### Authorization

- **Workspace isolation**: Every data query is scoped to a workspace. Users must be verified members before accessing any workspace resource.
- **Role-based access**: `OWNER` and `MEMBER` roles on `WorkspaceMember`. Only owners can add/remove members or delete workspaces.
- **Conversation access**: Users can only access conversations they are participants in.

---

## Database Design

PostgreSQL with Prisma ORM. Schema uses a multi-file layout (`prismaSchemaFolder`).

```
┌──────────┐       ┌─────────────────┐       ┌──────────────┐
│   User   │───┐   │ WorkspaceMember  │   ┌──│  Workspace   │
│          │   └──▶│  (composite PK)  │◀──┘  │              │
│ id       │       │ workspaceId      │      │ id           │
│ email    │       │ userId           │      │ name         │
│ password │       │ role (OWNER|     │      │ createdById  │
│ isOnline │       │       MEMBER)    │      └──────┬───────┘
│ tokenVer │       └─────────────────┘              │
└────┬─────┘                                        │
     │           ┌──────────────┐                   │
     │      ┌───▶│ Conversation │◀──────────────────┘
     │      │    │              │
     │      │    │ id           │
     │      │    │ type (PRIVATE│
     │      │    │      |GROUP) │
     │      │    │ workspaceId  │
     │      │    └──────┬───────┘
     │      │           │
     │  ┌───┴────┐  ┌───▼─────┐
     └─▶│Participant│ │ Message │
        │          │  │         │
        │ convId   │  │ content │
        │ userId   │  │ status  │
        └──────────┘  │ senderId│
                      └─────────┘
```

**Key design decisions:**
- `WorkspaceMember` uses a composite primary key `(workspaceId, userId)` — enforces uniqueness at the database level
- `Conversation` is always scoped to a workspace via `workspaceId` foreign key with `onDelete: Cascade`
- `Message.status` enum (`SENT | DELIVERED | READ`) is schema-ready for read receipts
- All timestamps use `Timestamptz(3)` for timezone-aware precision
- Online presence fields (`isOnline`, `lastSeenAt`) updated on login/logout

---

## API Reference

All protected routes require `Authorization: Bearer <accessToken>`.

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Create a new user account |
| POST | `/login` | — | Authenticate and receive tokens |
| POST | `/refresh` | Cookie | Rotate refresh token, get new access token |
| POST | `/logout` | Bearer | Invalidate refresh token, set user offline |
| GET | `/me` | Bearer | Get current user profile |

### Workspaces (`/api/workspaces`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Bearer | Create a workspace (creator becomes OWNER) |
| GET | `/` | Bearer | List all workspaces for the current user |
| GET | `/:workspaceId` | Bearer | Get workspace details with members |
| POST | `/:workspaceId/members` | Bearer | Add members (OWNER only) |
| DELETE | `/:workspaceId/members/:userId` | Bearer | Remove a member (OWNER only) |
| DELETE | `/:workspaceId` | Bearer | Delete workspace (OWNER only) |

### Conversations (`/api/conversations`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/private` | Bearer | Create or retrieve a private conversation |
| GET | `/?workspaceId=` | Bearer | List conversations in a workspace |

### Messages (`/api/messages`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Bearer | Send a message to a conversation |
| GET | `/:conversationId/messages` | Bearer | Get all messages in a conversation |

### Response Format

All endpoints return a consistent envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Human-readable error message" }
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20+ | Runtime |
| Express | 5.x | HTTP framework |
| TypeScript | 5.9 | Type safety |
| Prisma | 7.x | ORM and migrations |
| PostgreSQL | 15+ | Primary database |
| JWT | — | Authentication tokens |
| bcryptjs | — | Password hashing |
| Docker Compose | — | Database container |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| Vite | 7.x | Build tool and dev server |
| TypeScript | 5.9 | Type safety |
| TailwindCSS | 3.x | Styling |
| Zustand | 5.x | State management |
| Axios | — | HTTP client |
| React Router | 7.x | Client-side routing |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker (for PostgreSQL)

### Setup

```bash
# Clone the repository
git clone https://github.com/Jagadeesh9110/TeamConnect.git
cd TeamConnect

# Start PostgreSQL
cd server
docker compose up -d

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and JWT secrets

# Run database migrations
npx prisma migrate dev

# Start the development server
npm run dev
```

```bash
# In a separate terminal — start the client
cd client
npm install
npm run dev
```

---

## Project Structure

```
TeamConnect/
├── client/                         # React frontend
│   └── src/
│       ├── app/                    # Pages, components, layouts
│       ├── hooks/                  # Custom React hooks
│       ├── lib/                    # API client, utilities
│       ├── store/                  # Zustand state management
│       └── types/                  # TypeScript type definitions
│
├── server/                         # Express backend
│   ├── prisma/
│   │   └── schema/                 # Multi-file Prisma schema
│   │       ├── User.prisma
│   │       ├── Workspace.prisma
│   │       ├── WorkspaceMember.prisma
│   │       ├── Conversation.prisma
│   │       ├── Participant.prisma
│   │       └── Message.prisma
│   └── src/
│       ├── controllers/            # Request handlers
│       ├── middleware/             # JWT auth middleware
│       ├── routes/                 # Route definitions
│       ├── utils/                  # Token generation helpers
│       ├── config/                 # Prisma client setup
│       ├── app.ts                  # Express app configuration
│       └── server.ts               # Server entry point
│
└── README.md
```

---

## Roadmap

| Phase | Feature | Status |
|-------|---------|--------|
| ✅ | Multi-workspace backend with RBAC | Complete |
| ✅ | JWT auth with rotating refresh tokens | Complete |
| ✅ | Private and group conversations | Complete |
| ✅ | Message persistence and retrieval | Complete |
| ✅ | Online/offline presence tracking | Complete |
| ✅ | Standardized API response format | Complete |
| 🔲 | WebSocket real-time messaging | Planned |
| 🔲 | Typing indicators and read receipts | Planned |
| 🔲 | AI conversation summarization | Planned |
| 🔲 | AI action item extraction | Planned |

---

## License

This project is licensed under the MIT License.