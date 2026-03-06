# TeamConnect

A collaborative conversation platform that transforms team discussions into structured knowledge. Instead of letting important decisions and action items get buried in message threads, TeamConnect extracts and organizes key outcomes from conversations into a dedicated Knowledge Hub.

## Project Overview

TeamConnect is built around a simple idea: team conversations produce valuable outcomes — decisions, tasks, and insights — but these outcomes are often lost in long chat histories.

The platform provides:
- **Workspace-based collaboration** where teams organize around shared workspaces
- **Real-time conversations** with instant messaging via WebSockets
- **Knowledge extraction** that captures decisions, action items, and AI-generated summaries directly from discussions
- **AI-powered summaries** using Google Gemini to distill conversation context into concise, structured summaries

## Key Features

### Authentication
- User registration and login with JWT-based authentication
- Access token and refresh token mechanism
- Email verification flow
- Secure password hashing with bcrypt

### Workspaces
- Create and manage workspaces
- Invite members by email
- Role-based workspace ownership
- Pending invite management with revocation
- Rate-limited invite endpoint

### Conversations
- Private (1:1) and group conversations
- Add workspace members to conversations
- Real-time messaging with Socket.IO
- Message editing and soft-delete
- Typing indicators and presence tracking

### Knowledge Hub
Each conversation includes a Knowledge Hub panel that organizes structured information from discussions:

**Action Items**
- Create tasks directly from conversations
- Assign to conversation participants
- Track status: `OPEN` → `IN_PROGRESS` → `DONE`
- Real-time updates across participants

**Decision Log**
- Record decisions made during discussions
- Track author and timestamp
- Maintain a searchable decision history

**AI Conversation Summaries**
- Generate summaries from the last 50 messages using Gemini AI
- Structured prompt extracts decisions, constraints, and key ideas
- 5-minute cooldown prevents unnecessary API calls
- Summaries stored in the database and broadcast in real time

## Technology Stack

| Layer | Technologies |
|---|---|
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| Real-Time | Socket.IO |
| Authentication | JWT (access + refresh tokens), bcrypt |
| AI | Google Gemini API (gemini-1.5-flash) |
| Frontend | React, TypeScript, Vite, TailwindCSS |

## System Architecture

```
Workspace
  │
  ├── Members
  │
  └── Conversations
        │
        ├── Participants
        │
        ├── Messages
        │
        ├── Action Items
        │
        ├── Decisions
        │
        └── Summaries (AI-generated)
```

The architecture follows a layered approach with clear separation of concerns:

```
Client (React)
  │
  ├── API Layer (axios abstraction)
  ├── Socket Layer (Socket.IO client)
  └── State Management (Zustand)

Server (Express)
  │
  ├── Routes
  ├── Middleware (auth, error handling)
  ├── Controllers
  ├── Services (Gemini AI)
  └── Database (Prisma ORM → PostgreSQL)
```

## Database Design

```
User
 ├── WorkspaceMember → Workspace
 ├── Participant → Conversation
 ├── Message
 ├── ActionItem (created / assigned)
 └── Decision (created)

Workspace
 ├── WorkspaceMember
 ├── WorkspaceInvite
 └── Conversation
      ├── Participant
      ├── Message
      ├── ActionItem
      ├── Decision
      └── ConversationSummary
```

Key design decisions:
- Cascade deletes on conversation-scoped entities
- Action items scoped to conversation participants (not workspace-wide)
- Summaries track `messageCount` to indicate staleness
- Soft-delete for messages to preserve conversation integrity

## API Overview

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/verify-email/:token` | Verify email |

### Workspaces
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/workspaces` | Create workspace |
| GET | `/api/workspaces` | List user workspaces |
| GET | `/api/workspaces/:id/members` | List workspace members |
| POST | `/api/workspace-invites/send` | Send email invite |
| DELETE | `/api/workspace-invites/:id` | Revoke invite |

### Conversations
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/conversations/private` | Create private conversation |
| POST | `/api/conversations/group` | Create group conversation |
| GET | `/api/conversations` | List user conversations |
| POST | `/api/conversations/:id/participants` | Add member |

### Messages
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/messages` | Send message |
| GET | `/api/messages/:conversationId` | Get messages |
| PATCH | `/api/messages/:id` | Edit message |
| DELETE | `/api/messages/:id` | Soft-delete message |

### Action Items
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/conversations/:id/action-items` | Create action item |
| GET | `/api/conversations/:id/action-items` | List action items |
| PATCH | `/api/action-items/:id` | Update status/description |
| DELETE | `/api/action-items/:id` | Delete action item |

### Decisions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/conversations/:id/decisions` | Record decision |
| GET | `/api/conversations/:id/decisions` | List decisions |
| DELETE | `/api/decisions/:id` | Delete decision |

### AI Summary
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/conversations/:id/summarize` | Generate AI summary |
| GET | `/api/conversations/:id/summary` | Get latest summary |

## Project Structure

```
TeamConnect/
├── server/
│   ├── prisma/
│   │   └── schema/              # Prisma schema files (multi-file)
│   └── src/
│       ├── config/              # Database and environment config
│       ├── controllers/         # Request handlers
│       ├── middleware/          # Auth and error middleware
│       ├── routes/             # Express route definitions
│       ├── services/           # Business logic (Gemini AI)
│       ├── socket/             # Socket.IO server and event handlers
│       ├── utils/              # Email utilities
│       ├── app.ts              # Express app setup
│       └── server.ts           # Server entry point
│
└── client/
    └── src/
        ├── app/
        │   ├── chart/          # Chat UI components (Knowledge Hub, Messages)
        │   ├── components/     # Shared components
        │   ├── layout/         # Layout wrappers
        │   └── pages/          # Route pages
        ├── hooks/              # Custom React hooks
        ├── lib/                # API client, socket client
        ├── store/              # Zustand state management
        └── types/              # TypeScript type definitions
```

## Running the Project

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Google Gemini API key

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/teamconnect_db
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email
SMTP_PASS=your_app_password
```

Run migrations and start the server:

```bash
npx prisma migrate dev
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the backend on `http://localhost:5000`.