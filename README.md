# TeamConnect
A real-time secure team messaging platform with AI-powered summarization and assistance, designed for productive team communication using WebSockets

**Real-time collaboration meets AI intelligence—turning messy group chats into structured, actionable workflows.**

TeamConnect is a purpose-built communication platform designed for **engineering and academic teams** who need more than just "chat." It combines low-latency, WebSocket-based real-time messaging with an intelligent AI layer that parses conversations to extract context, summarize long threads, and highlight action items.

Unlike social apps (WhatsApp) built for engagement or enterprise suites (Teams) that can become noisy firehoses, TeamConnect focuses on **signal-over-noise**. It provides a distraction-free environment where project history is preserved and transformed into retrieval-ready intelligence, ensuring users can catch up in seconds—not minutes.

## ❓ The Problem

In fast-paced project environments, **information overload** is a critical bottleneck:
*   **Context Decay**: Key decisions made 200 messages ago get buried under "catch-up" chatter.
*   **The "Catch-Up" Tax**: Team members returning after a few hours offline struggle to find relevant tasks without scrolling endlessly.
*   **Tool Mismatch**: Social apps lack structure for work, while full enterprise tools are often too heavy or expensive for agile student/project groups.

**TeamConnect** solves this by integrating **AI summarization directly into the message loop**, acting as a real-time scribe that organizes chaos into clarity.


---

## 🚀 Features

### Core Messaging
- Secure user authentication using JWT
- One-to-one and group conversations
- Real-time message delivery using WebSockets
- Online/offline presence indication
- Typing indicators
- Message delivery and read receipts
- Persistent message history

### AI-Assisted Productivity
- Conversation summarization for long chat threads
- AI-generated reply suggestions
- Action and key-point extraction from discussions
- AI-powered message improvement (optional)

### Platform Focus
- Designed for team and group communication
- Not dependent on mobile devices
- Structured and productivity-oriented messaging

---

## 🛠 Tech Stack

### Frontend
- React.js (TypeScript)
- TailwindCSS
- WebSocket Client

### Backend
- Node.js
- Express.js
- WebSocket Server
- JWT Authentication

### Database
- MongoDB

### AI Integration
- Gemini API (server-side only)

### Optional (for scaling)
- Redis + Pub/Sub (used only when multiple backend servers are deployed)

---

## 🧩 System Architecture (High-Level)
chat-app/
│
├── client/                     # React + TypeScript
│   ├── HTTPS                  # REST APIs
│   └── WSS                    # WebSockets
│
└── server/                     # Node.js + Express
    ├── MongoDB                # Users, Messages, Conversations
    ├── Gemini API             # AI Assistance
    └── Redis Pub/Sub          # (optional, for scaling)


---

## 🔐 Security

- JWT-based authentication for REST APIs and WebSocket connections
- Secure handling of user sessions
- Environment-based configuration for sensitive keys
- AI requests handled only by the backend

---

## 📦 Project Structure



TeamConnect/
│
├── client/                     # React frontend (TypeScript + TailwindCSS)
│
├── server/                     # Node.js backend (Express + WebSockets)
│
├── README.md
├── .gitignore
└── LICENSE


---

## 🎯 Project Objective

The goal of TeamConnect is to solve information overload in team chats by combining real-time communication with AI-powered assistance.  
AI is used only where it adds value—such as summarizing conversations and extracting important points—while the core messaging system remains fast, secure, and reliable.

---

## 📌 Status

🚧 This project is currently under active development.

---

## 📄 License

This project is licensed under the MIT License.