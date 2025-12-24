# TeamConnect

TeamConnect is a real-time secure team messaging platform designed for productive team communication.  
It supports instant messaging using WebSockets and enhances collaboration with AI-powered summarization and assistance.

Unlike social chat applications, TeamConnect is built specifically for teams, projects, and academic or professional groups, where conversations need to stay organized and actionable.

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
Client (React + TypeScript)
|
|--- HTTPS (REST APIs)
|--- WSS (WebSockets)
|
Backend (Node.js + Express)
|
|--- MongoDB (Users, Messages, Conversations)
|--- Gemini API (AI Assistance)
|--- Redis Pub/Sub (optional, for scaling)


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
├── client/ # React frontend (TypeScript + TailwindCSS)
├── server/ # Node.js backend (Express + WebSockets)
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

