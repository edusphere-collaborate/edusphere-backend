# EduSphere Frontend Development Guide

## Table of Contents
1. [Application Overview](#application-overview)
2. [Authentication System](#authentication-system)
3. [API Endpoints](#api-endpoints)
4. [WebSocket Events](#websocket-events)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Security Considerations](#security-considerations)
8. [Setup Instructions](#setup-instructions)
9. [Integration Examples](#integration-examples)

---

## Application Overview

**EduSphere** is a nonprofit educational platform designed for Ghanaian students (ages 15-30) that provides collaborative learning through discussion rooms, AI-driven academic support, and multimedia sharing. The backend is built with NestJS, TypeScript, and PostgreSQL.

### Key Features
- **User Authentication**: JWT-based registration and login system
- **Discussion Rooms**: Real-time collaborative learning spaces
- **AI Assistant**: Academic query processing with NLP support
- **Media Sharing**: Upload and share images/videos in discussion rooms
- **Real-time Messaging**: WebSocket-based chat functionality
- **User Profiles**: Comprehensive user management system

### Technology Stack
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport
- **Real-time**: Socket.IO for WebSocket communication
- **Validation**: Class-validator for input validation

### Base URL
- **Development**: `http://localhost:3000`
- **WebSocket**: `ws://localhost:3001`

---

## Authentication System

### JWT Token Structure
All authenticated requests require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### User Roles
- `User`: Standard user (default)
- `ADMIN`: Administrator with full access
- `MODERATOR`: Room moderator with limited admin rights
- `AI`: AI system user (internal use)

### Authentication Flow
1. Register new user or login with existing credentials
2. Receive JWT token in response
3. Include token in Authorization header for protected routes
4. Token expires after 24 hours (configurable)

---

## API Endpoints

### Authentication Endpoints

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid-string",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "User"
  },
  "token": "jwt-token-string"
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid-string",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "User"
  },
  "token": "jwt-token-string"
}
```

#### Get User Profile
```http
GET /auth/profile
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "id": "uuid-string",
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "User",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Room Endpoints

#### List All Rooms
```http
GET /rooms
```

**Response:**
```json
[
  {
    "id": "uuid-string",
    "name": "Mathematics Discussion",
    "description": "A room for math discussions",
    "slug": "math-discussion",
    "creator": {
      "id": "uuid-string",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe"
    },
    "userCount": 25,
    "messageCount": 150,
    "mediaCount": 5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Create Room
```http
POST /rooms
Content-Type: application/json

{
  "name": "Physics Study Group",
  "description": "Discussion room for physics topics",
  "slug": "physics-study-group",
  "creatorId": "uuid-string"
}
```

**Response:**
```json
{
  "id": "uuid-string",
  "name": "Physics Study Group",
  "slug": "physics-study-group",
  "creatorId": "uuid-string",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get Room Details
```http
GET /rooms/:id
```

**Response:**
```json
{
  "id": "uuid-string",
  "name": "Physics Study Group",
  "description": "Discussion room for physics topics",
  "slug": "physics-study-group",
  "creator": {
    "id": "uuid-string",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "users": [
    {
      "id": "uuid-string",
      "username": "jane_smith",
      "firstName": "Jane",
      "lastName": "Smith"
    }
  ],
  "messages": [
    {
      "id": "uuid-string",
      "content": "Hello everyone!",
      "userId": "uuid-string",
      "username": "jane_smith",
      "sentAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "stats": {
    "users": 25,
    "messages": 150,
    "media": 5
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### Send Message to Room
```http
POST /rooms/:id/messages
Content-Type: application/json

{
  "content": "Hello everyone!",
  "userId": "uuid-string"
}
```

**Response:**
```json
{
  "id": "uuid-string",
  "roomId": "uuid-string",
  "userId": "uuid-string",
  "content": "Hello everyone!",
  "user": {
    "id": "uuid-string",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "sentAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get Room Messages
```http
GET /rooms/:id/messages?skip=0&take=50
```

**Response:**
```json
[
  {
    "id": "uuid-string",
    "content": "Hello everyone!",
    "userId": "uuid-string",
    "user": {
      "id": "uuid-string",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe"
    },
    "sentAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### Join Room
```http
POST /rooms/:id/join
Content-Type: application/json

{
  "userId": "uuid-string"
}
```

**Response:**
```json
{
  "message": "User successfully joined the room",
  "room": {
    "id": "uuid-string",
    "name": "Physics Study Group",
    "users": [
      {
        "id": "uuid-string",
        "username": "john_doe",
        "firstName": "John",
        "lastName": "Doe"
      }
    ]
  }
}
```

### AI Endpoints

#### Submit AI Query
```http
POST /ai/query
Content-Type: application/json

{
  "userId": "uuid-string",
  "query": "What is the formula for kinetic energy?"
}
```

**Response:**
```json
{
  "id": "uuid-string",
  "userId": "uuid-string",
  "query": "What is the formula for kinetic energy?",
  "response": {
    "answer": "The formula for kinetic energy is KE = ½mv²",
    "explanation": "Where m is mass and v is velocity..."
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "user": {
    "id": "uuid-string",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Get AI Queries
```http
GET /ai/queries?skip=0&take=50
```

#### Get User's AI Queries
```http
GET /ai/users/:userId/queries?skip=0&take=50
```

### Media Endpoints

#### Upload Media
```http
POST /media
Content-Type: application/json

{
  "url": "https://example.com/image.jpg",
  "type": "IMAGE",
  "userId": "uuid-string",
  "roomId": "uuid-string"
}
```

**Response:**
```json
{
  "id": "uuid-string",
  "url": "https://example.com/image.jpg",
  "type": "IMAGE",
  "userId": "uuid-string",
  "roomId": "uuid-string",
  "user": {
    "id": "uuid-string",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "room": {
    "id": "uuid-string",
    "name": "Physics Study Group",
    "slug": "physics-study-group"
  },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### Get Room Media
```http
GET /media/room/:roomId?skip=0&take=50
```

**Response:**
```json
[
  {
    "id": "uuid-string",
    "url": "https://example.com/image.jpg",
    "type": "IMAGE",
    "user": {
      "id": "uuid-string",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### User Management Endpoints

#### Get User Details (Protected)
```http
GET /users/:id
Authorization: Bearer <jwt_token>
```

#### Get Public User Profile
```http
GET /users/:id/public
```

#### Update User Profile (Protected)
```http
PATCH /users/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "firstName": "Johnny",
  "lastName": "Doe"
}
```

---

## WebSocket Events

### Connection
Connect to WebSocket server at `ws://localhost:3001`

### Client-to-Server Events

#### Join Room
```javascript
socket.emit('join-room', {
  room_id: 'uuid-string',
  user_id: 'uuid-string'
});
```

#### Leave Room
```javascript
socket.emit('leave-room', {
  room_id: 'uuid-string',
  user_id: 'uuid-string'
});
```

#### Send Message
```javascript
socket.emit('send-message', {
  room_id: 'uuid-string',
  user_id: 'uuid-string',
  content: 'Hello everyone!'
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  room_id: 'uuid-string',
  user_id: 'uuid-string',
  is_typing: true
});
```

#### Get Room Info
```javascript
socket.emit('get-room-info', {
  room_id: 'uuid-string'
});
```

### Server-to-Client Events

#### Joined Room
```javascript
socket.on('joined-room', (data) => {
  console.log(data);
  // {
  //   room_id: 'uuid-string',
  //   user_id: 'uuid-string',
  //   message: 'Successfully joined room: Physics Study Group'
  // }
});
```

#### User Joined
```javascript
socket.on('user-joined', (data) => {
  console.log(data);
  // {
  //   user_id: 'uuid-string',
  //   username: 'john_doe',
  //   message: 'User john_doe joined the room'
  // }
});
```

#### User Left
```javascript
socket.on('user-left', (data) => {
  console.log(data);
  // {
  //   user_id: 'uuid-string',
  //   username: 'john_doe',
  //   message: 'User john_doe left the room'
  // }
});
```

#### New Message
```javascript
socket.on('new-message', (data) => {
  console.log(data);
  // {
  //   id: 'uuid-string',
  //   room_id: 'uuid-string',
  //   user_id: 'uuid-string',
  //   content: 'Hello everyone!',
  //   user: {
  //     id: 'uuid-string',
  //     username: 'john_doe',
  //     firstName: 'John',
  //     lastName: 'Doe'
  //   },
  //   sent_at: '2024-01-01T00:00:00.000Z'
  // }
});
```

#### User Typing
```javascript
socket.on('user-typing', (data) => {
  console.log(data);
  // {
  //   user_id: 'uuid-string',
  //   username: 'john_doe',
  //   is_typing: true
  // }
});
```

#### Room Info
```javascript
socket.on('room-info', (data) => {
  console.log(data);
  // {
  //   room: {
  //     id: 'uuid-string',
  //     name: 'Physics Study Group',
  //     description: 'Discussion room for physics topics',
  //     creator: { ... },
  //     userCount: 25,
  //     messageCount: 150
  //   }
  // }
});
```

#### Error
```javascript
socket.on('error', (data) => {
  console.error(data);
  // {
  //   message: 'Room not found'
  // }
});
```

---

## Data Models

### User Model
```typescript
interface User {
  id: string;                 // UUID
  username: string;           // Max 30 chars, unique
  firstName?: string;         // Optional
  lastName?: string;          // Optional
  email: string;              // Max 50 chars, unique, valid email
  password: string;           // Hashed, min 6 chars
  role: 'User' | 'ADMIN' | 'MODERATOR' | 'AI';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;           // Soft delete
}
```

### Room Model
```typescript
interface Room {
  id: string;                 // UUID
  name: string;               // Required
  description?: string;       // Optional
  slug: string;               // Unique, URL-friendly
  creatorId: string;          // Foreign key to User
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;           // Soft delete
  creator: User;              // Relation
  users: User[];              // Many-to-many relation
  messages: Message[];        // One-to-many relation
  media: Media[];             // One-to-many relation
}
```

### Message Model
```typescript
interface Message {
  id: string;                 // UUID
  content: string;            // Required
  userId: string;             // Foreign key to User
  roomId: string;             // Foreign key to Room
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;           // Soft delete
  user: User;                 // Relation
  room: Room;                 // Relation
}
```

### Media Model
```typescript
interface Media {
  id: string;                 // UUID
  url: string;                // Required, file URL
  type: 'IMAGE' | 'VIDEO';    // Media type enum
  userId: string;             // Foreign key to User
  roomId: string;             // Foreign key to Room
  createdAt: Date;
  updatedAt: Date;
  user: User;                 // Relation
  room: Room;                 // Relation
}
```

### AIQuery Model
```typescript
interface AIQuery {
  id: string;                 // UUID
  query: string;              // Required
  response: any;              // JSON response from AI
  userId: string;             // Foreign key to User
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;           // Soft delete
  user: User;                 // Relation
}
```

### Field Validation Rules

#### User Registration
- `username`: Required, string, max 30 chars, unique
- `firstName`: Optional, string
- `lastName`: Optional, string
- `email`: Required, valid email, max 50 chars, unique
- `password`: Required, string, min 6 chars

#### Room Creation
- `name`: Required, string, max 100 chars
- `description`: Optional, string, max 255 chars
- `slug`: Required, string, max 100 chars, unique
- `creatorId`: Required, valid UUID

#### Message Creation
- `content`: Required, string
- `userId`: Required, valid UUID
- `roomId`: Required, valid UUID

#### Media Upload
- `url`: Required, string (valid URL)
- `type`: Required, enum ('IMAGE' | 'VIDEO')
- `userId`: Required, valid UUID
- `roomId`: Required, valid UUID

#### AI Query
- `userId`: Required, valid UUID
- `query`: Required, string

---

## Error Handling

### HTTP Status Codes
- `200`: OK - Successful request
- `201`: Created - Resource created successfully
- `400`: Bad Request - Invalid request data
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Access denied
- `404`: Not Found - Resource not found
- `409`: Conflict - Resource already exists
- `422`: Unprocessable Entity - Validation error
- `500`: Internal Server Error - Server error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

### Common Error Messages
- `"User not found"` - Invalid user ID
- `"Room not found"` - Invalid room ID
- `"Unauthorized access to profile"` - Access denied
- `"Admin access required"` - Admin role required
- `"Validation failed"` - Input validation error
- `"Email already exists"` - Duplicate email
- `"Username already exists"` - Duplicate username

---

## Security Considerations

### Authentication
- JWT tokens expire after 24 hours
- Passwords are hashed using bcrypt
- All sensitive endpoints require authentication
- Role-based access control implemented

### Input Validation
- All inputs are validated using class-validator
- SQL injection prevention through Prisma ORM
- XSS protection through input sanitization
- CORS enabled for frontend domains

### Data Protection
- HTTPS required for all API requests
- Sensitive data encrypted at rest
- User passwords never returned in responses
- Soft delete for data retention

### Rate Limiting
- Implement rate limiting on frontend to prevent abuse
- Consider implementing API rate limiting for production

---

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Environment variables configured

### Environment Variables
Create a `.env` file with:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/edusphere"
JWT_SECRET="your-jwt-secret-key"
PORT=3000
```

### Backend Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### Frontend Integration
```bash
# Install HTTP client (axios recommended)
npm install axios

# Install Socket.IO client
npm install socket.io-client

# Install TypeScript types (optional)
npm install --save-dev @types/socket.io-client
```

---

## Integration Examples

### React Hook for Authentication
```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`);
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });
      
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.response?.data?.message };
    }
  };

  const register = async (userData: {
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
    password: string;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      
      const { user, token } = response.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
};
```

### React Hook for Rooms
```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export interface Room {
  id: string;
  name: string;
  description?: string;
  slug: string;
  creator: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  userCount: number;
  messageCount: number;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
}

export const useRooms = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (roomData: {
    name: string;
    description?: string;
    slug: string;
    creatorId: string;
  }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/rooms`, roomData);
      await fetchRooms(); // Refresh rooms list
      return { success: true, room: response.data };
    } catch (error) {
      console.error('Failed to create room:', error);
      return { success: false, error: error.response?.data?.message };
    }
  };

  const joinRoom = async (roomId: string, userId: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/rooms/${roomId}/join`, {
        userId,
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Failed to join room:', error);
      return { success: false, error: error.response?.data?.message };
    }
  };

  return {
    rooms,
    loading,
    fetchRooms,
    createRoom,
    joinRoom,
  };
};
```

### WebSocket Chat Component
```typescript
import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

const SOCKET_URL = 'ws://localhost:3001';

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  sent_at: string;
}

interface ChatProps {
  roomId: string;
  userId: string;
  username: string;
}

export const Chat: React.FC<ChatProps> = ({ roomId, userId, username }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Join room
    newSocket.emit('join-room', {
      room_id: roomId,
      user_id: userId,
    });

    // Listen for events
    newSocket.on('joined-room', (data) => {
      console.log('Joined room:', data);
    });

    newSocket.on('user-joined', (data) => {
      console.log('User joined:', data);
    });

    newSocket.on('user-left', (data) => {
      console.log('User left:', data);
    });

    newSocket.on('new-message', (data: Message) => {
      setMessages(prev => [...prev, data]);
    });

    newSocket.on('user-typing', (data) => {
      if (data.user_id !== userId) {
        setTypingUsers(prev => 
          data.is_typing 
            ? [...prev.filter(id => id !== data.user_id), data.user_id]
            : prev.filter(id => id !== data.user_id)
        );
      }
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (socket && messageInput.trim()) {
      socket.emit('send-message', {
        room_id: roomId,
        user_id: userId,
        content: messageInput.trim(),
      });
      setMessageInput('');
    }
  };

  const handleTyping = (typing: boolean) => {
    if (socket && typing !== isTyping) {
      socket.emit('typing', {
        room_id: roomId,
        user_id: userId,
        is_typing: typing,
      });
      setIsTyping(typing);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <strong>{message.user.username}:</strong> {message.content}
            <span className="timestamp">
              {new Date(message.sent_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="message-input">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => handleTyping(true)}
          onBlur={() => handleTyping(false)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};
```

### AI Query Component
```typescript
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

interface AIQueryProps {
  userId: string;
}

export const AIQuery: React.FC<AIQueryProps> = ({ userId }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const submitQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const result = await axios.post(`${API_BASE_URL}/ai/query`, {
        userId,
        query: query.trim(),
      });
      
      setResponse(result.data);
    } catch (error) {
      console.error('Failed to submit AI query:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-query">
      <h3>AI Assistant</h3>
      <div className="query-input">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your academic question here..."
          rows={4}
        />
        <button onClick={submitQuery} disabled={loading}>
          {loading ? 'Processing...' : 'Ask AI'}
        </button>
      </div>
      
      {response && (
        <div className="ai-response">
          <h4>AI Response:</h4>
          <p><strong>Query:</strong> {response.query}</p>
          <div className="response-content">
            {typeof response.response === 'string' 
              ? response.response 
              : JSON.stringify(response.response, null, 2)
            }
          </div>
          <p className="timestamp">
            {new Date(response.createdAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
};
```

### Axios Instance Configuration
```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## Additional Notes

### Pagination
Most list endpoints support pagination with `skip` and `take` parameters:
- `skip`: Number of items to skip (default: 0)
- `take`: Number of items to return (default: 50, max: 100)

### File Upload
The media upload endpoint currently expects a URL. For actual file uploads, you'll need to implement:
1. File upload to cloud storage (AWS S3, Cloudinary, etc.)
2. Pass the resulting URL to the media endpoint

### Real-time Updates
Use WebSocket events for real-time features:
- New messages in chat rooms
- User join/leave notifications
- Typing indicators
- Room updates

### Performance Considerations
- Implement proper loading states
- Use pagination for large data sets
- Consider implementing caching for frequently accessed data
- Optimize WebSocket connections (reconnection logic, heartbeat)

### Error Handling Best Practices
- Always handle API errors gracefully
- Provide user-friendly error messages
- Implement retry logic for network failures
- Log errors for debugging purposes

---

This documentation provides comprehensive guidance for frontend developers to integrate with the EduSphere backend. For additional support or questions, please refer to the main README.md or contact the development team.