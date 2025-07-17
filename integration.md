# EduSphere Backend Integration Guide

This guide provides comprehensive instructions for frontend developers to integrate with the EduSphere backend API and WebSocket services.

## Base Configuration

### API Base URL
- **Development**: `http://localhost:3000`
- **Production**: Update with your deployed backend URL

### WebSocket Connection
- **Development**: `ws://localhost:3001`
- **Production**: Update with your deployed WebSocket URL

## Authentication System

### Overview
The authentication system uses JWT tokens with email/username and password-based login.

### 1. User Registration

**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "user": {
    "id": "user-uuid",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "USER"
  },
  "token": "jwt-token-here"
}
```

**Frontend Implementation**:
```javascript
async function registerUser(userData) {
  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });
  
  if (response.ok) {
    const data = await response.json();
    // Store token in localStorage or secure storage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }
  
  throw new Error('Registration failed');
}
```

### 2. User Login

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "identifier": "john@example.com",
  "password": "securePassword123"
}
```

**Response**: Same as registration response

**Frontend Implementation**:
```javascript
async function loginUser(credentials) {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials)
  });
  
  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }
  
  throw new Error('Login failed');
}
```

### 3. Get User Profile

**Endpoint**: `GET /auth/profile`

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "id": "user-uuid",
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "USER",
  "createdAt": "2023-12-01T00:00:00.000Z",
  "updatedAt": "2023-12-01T00:00:00.000Z"
}
```

**Frontend Implementation**:
```javascript
async function getUserProfile() {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/auth/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    return await response.json();
  }
  
  throw new Error('Failed to fetch profile');
}
```

## User Management

### 1. Get All Users (Admin Only)

**Endpoint**: `GET /users?skip=0&take=50`

**Headers**: `Authorization: Bearer <token>`

### 2. Get User by ID

**Endpoint**: `GET /users/{userId}`

**Headers**: `Authorization: Bearer <token>`

### 3. Update User Profile

**Endpoint**: `PATCH /users/{userId}`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "username": "new_username",
  "firstName": "New First Name",
  "lastName": "New Last Name",
  "email": "new@example.com"
}
```

## Room Management

### 1. Create Room

**Endpoint**: `POST /rooms`

**Request Body**:
```json
{
  "name": "JavaScript Study Group",
  "description": "A room for discussing JavaScript concepts",
  "slug": "js-study-group",
  "creatorId": "user-uuid"
}
```

**Response**:
```json
{
  "id": "room-uuid",
  "name": "JavaScript Study Group",
  "slug": "js-study-group",
  "creatorId": "user-uuid",
  "createdAt": "2023-12-01T00:00:00.000Z"
}
```

### 2. Get All Rooms

**Endpoint**: `GET /rooms`

**Response**:
```json
[
  {
    "id": "room-uuid",
    "name": "JavaScript Study Group",
    "description": "A room for discussing JavaScript concepts",
    "slug": "js-study-group",
    "creator": {
      "id": "user-uuid",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe"
    },
    "userCount": 15,
    "messageCount": 247,
    "mediaCount": 12,
    "createdAt": "2023-12-01T00:00:00.000Z",
    "updatedAt": "2023-12-01T00:00:00.000Z"
  }
]
```

### 3. Get Room Details

**Endpoint**: `GET /rooms/{roomId}`

**Response**:
```json
{
  "id": "room-uuid",
  "name": "JavaScript Study Group",
  "description": "A room for discussing JavaScript concepts",
  "slug": "js-study-group",
  "creator": {
    "id": "user-uuid",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "users": [
    {
      "id": "user-uuid",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe"
    }
  ],
  "messages": [
    {
      "id": "message-uuid",
      "content": "Hello everyone!",
      "userId": "user-uuid",
      "username": "john_doe",
      "sentAt": "2023-12-01T00:00:00.000Z"
    }
  ],
  "stats": {
    "users": 15,
    "messages": 247,
    "media": 12
  },
  "createdAt": "2023-12-01T00:00:00.000Z",
  "updatedAt": "2023-12-01T00:00:00.000Z"
}
```

### 4. Join Room

**Endpoint**: `POST /rooms/{roomId}/join`

**Request Body**:
```json
{
  "userId": "user-uuid"
}
```

### 5. Send Message to Room

**Endpoint**: `POST /rooms/{roomId}/messages`

**Request Body**:
```json
{
  "content": "Hello everyone!",
  "userId": "user-uuid"
}
```

**Response**:
```json
{
  "id": "message-uuid",
  "roomId": "room-uuid",
  "userId": "user-uuid",
  "content": "Hello everyone!",
  "user": {
    "id": "user-uuid",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "sentAt": "2023-12-01T00:00:00.000Z"
}
```

### 6. Get Room Messages

**Endpoint**: `GET /rooms/{roomId}/messages?skip=0&take=50`

## WebSocket Integration (Real-time Features)

### Connection Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001', {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
```

### 1. Join Room

**Emit Event**: `join-room`

**Payload**:
```json
{
  "room_id": "room-uuid",
  "user_id": "user-uuid"
}
```

**Listen Events**:
```javascript
socket.on('joined-room', (data) => {
  console.log('Successfully joined room:', data);
});

socket.on('user-joined', (data) => {
  console.log('User joined room:', data);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### 2. Leave Room

**Emit Event**: `leave-room`

**Payload**:
```json
{
  "room_id": "room-uuid",
  "user_id": "user-uuid"
}
```

**Listen Events**:
```javascript
socket.on('left-room', (data) => {
  console.log('Successfully left room:', data);
});

socket.on('user-left', (data) => {
  console.log('User left room:', data);
});
```

### 3. Send Message

**Emit Event**: `send-message`

**Payload**:
```json
{
  "room_id": "room-uuid",
  "user_id": "user-uuid",
  "content": "Hello everyone!"
}
```

**Listen Events**:
```javascript
socket.on('new-message', (messageData) => {
  console.log('New message received:', messageData);
  // Update UI with new message
});
```

### 4. Typing Indicator

**Emit Event**: `typing`

**Payload**:
```json
{
  "room_id": "room-uuid",
  "user_id": "user-uuid",
  "is_typing": true
}
```

**Listen Events**:
```javascript
socket.on('user-typing', (data) => {
  console.log('User typing status:', data);
  // Show/hide typing indicator
});
```

### 5. Get Room Information

**Emit Event**: `get-room-info`

**Payload**:
```json
{
  "room_id": "room-uuid"
}
```

**Listen Events**:
```javascript
socket.on('room-info', (data) => {
  console.log('Room information:', data);
});
```

## Media Management

### 1. Upload Media

**Endpoint**: `POST /media`

**Request Body**:
```json
{
  "url": "https://example.com/file.jpg",
  "type": "image",
  "userId": "user-uuid",
  "roomId": "room-uuid"
}
```

### 2. Simple Media Upload

**Endpoint**: `POST /media/upload`

**Request Body**:
```json
{
  "userId": "user-uuid",
  "roomId": "room-uuid",
  "fileUrl": "https://example.com/file.jpg",
  "fileType": "image"
}
```

### 3. Get Room Media

**Endpoint**: `GET /media/room/{roomId}?skip=0&take=50`

### 4. Get User Media

**Endpoint**: `GET /media/user/{userId}?skip=0&take=50`

## AI Assistant Integration

### 1. Submit AI Query

**Endpoint**: `POST /ai/query`

**Request Body**:
```json
{
  "userId": "user-uuid",
  "query": "Explain the concept of closures in JavaScript"
}
```

**Response**:
```json
{
  "id": "query-uuid",
  "userId": "user-uuid",
  "query": "Explain the concept of closures in JavaScript",
  "response": "A closure is a function that has access to variables from its outer scope...",
  "createdAt": "2023-12-01T00:00:00.000Z",
  "user": {
    "id": "user-uuid",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### 2. Get AI Queries

**Endpoint**: `GET /ai/queries?skip=0&take=50`

### 3. Get User's AI Queries

**Endpoint**: `GET /ai/users/{userId}/queries?skip=0&take=50`

## Error Handling

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **500**: Internal Server Error

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Frontend Error Handling

```javascript
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
```

## Authorization Headers

For all authenticated endpoints, include the JWT token in the Authorization header:

```javascript
const token = localStorage.getItem('authToken');

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

## Complete Frontend Integration Example

```javascript
class EduSphereAPI {
  constructor(baseURL = 'http://localhost:3000', wsURL = 'ws://localhost:3001') {
    this.baseURL = baseURL;
    this.wsURL = wsURL;
    this.socket = null;
  }

  // Authentication
  async register(userData) {
    return this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    return this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  // Rooms
  async getRooms() {
    return this.apiCall('/rooms');
  }

  async joinRoom(roomId, userId) {
    return this.apiCall(`/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  }

  // WebSocket
  connectWebSocket() {
    this.socket = io(this.wsURL);
    return this.socket;
  }

  joinRoomWebSocket(roomId, userId) {
    if (this.socket) {
      this.socket.emit('join-room', { room_id: roomId, user_id: userId });
    }
  }

  sendMessage(roomId, userId, content) {
    if (this.socket) {
      this.socket.emit('send-message', {
        room_id: roomId,
        user_id: userId,
        content
      });
    }
  }

  // Helper method
  async apiCall(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const response = await fetch(this.baseURL + endpoint, {
      ...defaultOptions,
      ...options
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Usage
const api = new EduSphereAPI();

// Initialize app
async function initApp() {
  try {
    // Connect WebSocket
    const socket = api.connectWebSocket();
    
    // Set up event listeners
    socket.on('new-message', (message) => {
      console.log('New message:', message);
    });

    socket.on('user-joined', (data) => {
      console.log('User joined:', data);
    });

    // Get rooms
    const rooms = await api.getRooms();
    console.log('Available rooms:', rooms);

  } catch (error) {
    console.error('App initialization failed:', error);
  }
}
```

## Security Considerations

1. **Token Storage**: Store JWT tokens securely (consider using httpOnly cookies for production)
2. **Token Expiration**: Implement token refresh logic
3. **Input Validation**: Validate all user inputs on the frontend
4. **CORS**: Configure CORS properly for your domain
5. **HTTPS**: Use HTTPS in production

## Testing Your Integration

1. Test all authentication flows
2. Test WebSocket connection and events
3. Test room creation and joining
4. Test message sending and receiving
5. Test error scenarios and edge cases

This guide covers all the major microprocesses and endpoints in the EduSphere backend. Follow these patterns to ensure full integration with your frontend application.