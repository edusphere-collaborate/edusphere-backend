# EduSphere Backend Integration Guide

This guide provides comprehensive instructions for frontend developers to integrate with the EduSphere backend API and WebSocket services.

## Base Configuration

### API Base URL
- **Development**: `http://localhost:3000`
- **Production**: Update with your deployed backend URL

### WebSocket Connection
- **Development**: `ws://localhost:3001`
- **Production**: Update with your deployed WebSocket URL

### Environment Setup

Before integrating with the backend, ensure you have the following environment variables configured:

**Required Environment Variables**:
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/edusphere"
JWT_SECRET="your-jwt-secret-key"
PORT=3000
NODE_ENV=development
```

**Database Setup**:
1. Install PostgreSQL
2. Create a database named `edusphere`
3. Run migrations: `npx prisma migrate deploy`
4. Generate Prisma client: `npx prisma generate`

**Starting the Backend**:
```bash
# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

**Health Check**:
Test if the backend is running:
```bash
curl http://localhost:3000
# Should return: "Hello World!"
```

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

**Validation Requirements**:
- `username`: String, required, max 30 characters, must be unique
- `firstName`: String, optional
- `lastName`: String, optional  
- `email`: String, required, must be valid email format, max 50 characters, must be unique
- `password`: String, required, minimum 6 characters

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

**Validation Example**:
```javascript
function validateRegistration(userData) {
  const errors = {};
  
  if (!userData.username || userData.username.length > 30) {
    errors.username = 'Username is required and must be less than 30 characters';
  }
  
  if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.email = 'Valid email is required';
  }
  
  if (!userData.password || userData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
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

**Validation Requirements**:
- `identifier`: String, required (can be email or username)
- `password`: String, required

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

**Validation Example**:
```javascript
function validateLogin(credentials) {
  const errors = {};
  
  if (!credentials.identifier) {
    errors.identifier = 'Email or username is required';
  }
  
  if (!credentials.password) {
    errors.password = 'Password is required';
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
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

### 4. Get User Profile by ID

**Endpoint**: `GET /auth/profile/{userId}`

**Headers**: `Authorization: Bearer <token>`

**Description**: Get profile of a specific user (restricted to admins or self)

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
async function getUserProfileById(userId) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(`/auth/profile/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    return await response.json();
  }
  
  throw new Error('Failed to fetch user profile');
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

### 4. Get Public User Profile

**Endpoint**: `GET /users/{userId}/public`

**Description**: Get public profile of a user (no authentication required)

**Response**:
```json
{
  "id": "user-uuid",
  "username": "john_doe",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2023-12-01T00:00:00.000Z"
}
```

**Frontend Implementation**:
```javascript
async function getPublicUserProfile(userId) {
  const response = await fetch(`/users/${userId}/public`);
  
  if (response.ok) {
    return await response.json();
  }
  
  throw new Error('Failed to fetch public profile');
}
```

### 5. Delete User (Admin Only)

**Endpoint**: `DELETE /users/{userId}`

**Headers**: `Authorization: Bearer <token>`

**Description**: Soft delete a user (admin only)

**Response**:
```json
{
  "message": "User with ID user-uuid was successfully soft-deleted"
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

**Validation Requirements**:
- `name`: String, required
- `description`: String, optional
- `slug`: String, optional (auto-generated from name if not provided), must be unique
- `creatorId`: String, required, must be valid user UUID

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

**Frontend Implementation**:
```javascript
async function createRoom(roomData) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(roomData)
  });
  
  if (response.ok) {
    return await response.json();
  }
  
  throw new Error('Failed to create room');
}
```

**Validation Example**:
```javascript
function validateRoom(roomData) {
  const errors = {};
  
  if (!roomData.name || roomData.name.trim().length === 0) {
    errors.name = 'Room name is required';
  }
  
  if (!roomData.creatorId) {
    errors.creatorId = 'Creator ID is required';
  }
  
  if (roomData.slug && !/^[a-z0-9-]+$/.test(roomData.slug)) {
    errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
  }
  
  return Object.keys(errors).length === 0 ? null : errors;
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

### 7. Update Room

**Endpoint**: `PATCH /rooms/{roomId}`

**Request Body**:
```json
{
  "name": "Updated Room Name",
  "description": "Updated description"
}
```

**Response**:
```json
{
  "id": "room-uuid",
  "name": "Updated Room Name",
  "description": "Updated description",
  "updatedAt": "2023-12-01T00:00:00.000Z"
}
```

### 8. Delete Room

**Endpoint**: `DELETE /rooms/{roomId}`

**Description**: Soft delete a room

**Response**:
```json
{
  "message": "Room with ID room-uuid was successfully soft-deleted."
}
```

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

### 5. Get All Media

**Endpoint**: `GET /media?skip=0&take=50`

**Description**: Get all media files with pagination

**Response**:
```json
[
  {
    "id": "media-uuid",
    "url": "https://example.com/file.jpg",
    "type": "image",
    "user": {
      "id": "user-uuid",
      "username": "john_doe",
      "firstName": "John",
      "lastName": "Doe"
    },
    "room": {
      "id": "room-uuid",
      "name": "JavaScript Study Group"
    },
    "createdAt": "2023-12-01T00:00:00.000Z"
  }
]
```

### 6. Get Single Media File

**Endpoint**: `GET /media/{mediaId}`

**Response**:
```json
{
  "id": "media-uuid",
  "url": "https://example.com/file.jpg",
  "type": "image",
  "user": {
    "id": "user-uuid",
    "username": "john_doe",
    "firstName": "John",
    "lastName": "Doe"
  },
  "room": {
    "id": "room-uuid",
    "name": "JavaScript Study Group"
  },
  "createdAt": "2023-12-01T00:00:00.000Z"
}
```

### 7. Update Media

**Endpoint**: `PATCH /media/{mediaId}`

**Request Body**:
```json
{
  "url": "https://example.com/updated-file.jpg",
  "type": "image"
}
```

**Response**:
```json
{
  "id": "media-uuid",
  "url": "https://example.com/updated-file.jpg",
  "type": "image",
  "user": {
    "id": "user-uuid",
    "username": "john_doe"
  },
  "room": {
    "id": "room-uuid",
    "name": "JavaScript Study Group"
  },
  "updatedAt": "2023-12-01T00:00:00.000Z"
}
```

### 8. Delete Media

**Endpoint**: `DELETE /media/{mediaId}`

**Response**:
```json
{
  "message": "Media with ID media-uuid was successfully deleted."
}
```

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

### 4. Get Single AI Query

**Endpoint**: `GET /ai/queries/{queryId}`

**Response**:
```json
{
  "id": "query-uuid",
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

**Frontend Implementation**:
```javascript
async function getAIQuery(queryId) {
  const response = await fetch(`/ai/queries/${queryId}`);
  
  if (response.ok) {
    return await response.json();
  }
  
  throw new Error('Failed to fetch AI query');
}
```

## Error Handling

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (resource doesn't exist)
- **409**: Conflict (duplicate resource)
- **500**: Internal Server Error

### Error Response Format

**Validation Error (400)**:
```json
{
  "statusCode": 400,
  "message": [
    "username must be a string",
    "email must be a valid email address",
    "password must be at least 6 characters"
  ],
  "error": "Bad Request"
}
```

**Authentication Error (401)**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**Not Found Error (404)**:
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

**Conflict Error (409)**:
```json
{
  "statusCode": 409,
  "message": "Username already exists",
  "error": "Conflict"
}
```

### Frontend Error Handling

```javascript
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle different error types
      switch (response.status) {
        case 400:
          throw new ValidationError(errorData.message);
        case 401:
          // Clear auth tokens and redirect to login
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new AuthError('Authentication required');
        case 403:
          throw new PermissionError('Insufficient permissions');
        case 404:
          throw new NotFoundError(errorData.message);
        case 409:
          throw new ConflictError(errorData.message);
        default:
          throw new APIError(errorData.message || 'API request failed');
      }
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Custom error classes
class APIError extends Error {
  constructor(message) {
    super(message);
    this.name = 'APIError';
  }
}

class ValidationError extends APIError {
  constructor(messages) {
    super(Array.isArray(messages) ? messages.join(', ') : messages);
    this.name = 'ValidationError';
    this.messages = Array.isArray(messages) ? messages : [messages];
  }
}

class AuthError extends APIError {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
  }
}

class PermissionError extends APIError {
  constructor(message) {
    super(message);
    this.name = 'PermissionError';
  }
}

class NotFoundError extends APIError {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends APIError {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
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

### 1. Authentication & Authorization

**JWT Token Management**:
```javascript
// Store tokens securely
class AuthManager {
  constructor() {
    this.tokenKey = 'authToken';
    this.userKey = 'user';
  }

  // Store token (consider using httpOnly cookies for production)
  storeToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  // Get token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Check if token exists and is valid
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  // Clear authentication
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
```

### 2. Input Validation & Sanitization

**Client-side validation** (always validate on server-side too):
```javascript
// Sanitize user input
function sanitizeInput(input) {
  return input.trim().replace(/[<>]/g, '');
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password) {
  // At least 6 characters, one letter, one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  return passwordRegex.test(password);
}
```

### 3. CORS Configuration

Ensure proper CORS settings for your frontend domain:
```javascript
// Backend CORS configuration (already configured)
const corsOptions = {
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
};
```

### 4. HTTPS in Production

**Always use HTTPS in production**:
- Use SSL/TLS certificates
- Redirect HTTP to HTTPS
- Use secure cookies
- Enable HSTS headers

### 5. WebSocket Security

```javascript
// Secure WebSocket connection
const socket = io('wss://your-domain.com', {
  auth: {
    token: localStorage.getItem('authToken')
  },
  secure: true
});

// Validate incoming WebSocket messages
socket.on('new-message', (data) => {
  // Validate message structure
  if (!data || !data.content || !data.user_id) {
    console.error('Invalid message format');
    return;
  }
  
  // Sanitize content
  const sanitizedContent = sanitizeInput(data.content);
  
  // Update UI with sanitized content
  displayMessage({
    ...data,
    content: sanitizedContent
  });
});
```

### 6. Rate Limiting

Implement client-side rate limiting for API calls:
```javascript
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  canMakeRequest() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
}

const rateLimiter = new RateLimiter();

async function rateLimitedApiCall(url, options) {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded');
  }
  
  return await apiCall(url, options);
}
```

### 7. Content Security Policy (CSP)

Implement CSP headers to prevent XSS attacks:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

### 8. Data Validation

Always validate data before sending to the server:
```javascript
class DataValidator {
  static validateUser(userData) {
    const errors = {};
    
    if (!userData.username || userData.username.length > 30) {
      errors.username = 'Username must be 1-30 characters';
    }
    
    if (!userData.email || !isValidEmail(userData.email)) {
      errors.email = 'Valid email required';
    }
    
    if (!userData.password || !isValidPassword(userData.password)) {
      errors.password = 'Password must be at least 6 characters with letter and number';
    }
    
    return errors;
  }
  
  static validateRoom(roomData) {
    const errors = {};
    
    if (!roomData.name || roomData.name.trim().length === 0) {
      errors.name = 'Room name is required';
    }
    
    if (roomData.slug && !/^[a-z0-9-]+$/.test(roomData.slug)) {
      errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }
    
    return errors;
  }
}
```

## Data Models & Enums

### User Roles
```javascript
const UserRole = {
  USER: 'User',
  ADMIN: 'ADMIN', 
  MODERATOR: 'MODERATOR',
  AI: 'AI'
};
```

### Media Types
```javascript
const MediaType = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO'
};
```

### Data Structures

**User Object**:
```javascript
{
  id: string,           // UUID
  username: string,     // Max 30 characters, unique
  firstName: string,    // Optional
  lastName: string,     // Optional
  email: string,        // Max 50 characters, unique
  role: UserRole,       // Default: 'User'
  createdAt: Date,
  updatedAt: Date
}
```

**Room Object**:
```javascript
{
  id: string,           // UUID
  name: string,         // Required
  description: string,  // Optional
  slug: string,         // Unique, auto-generated if not provided
  creatorId: string,    // UUID reference to User
  createdAt: Date,
  updatedAt: Date,
  users: User[],        // Array of users in the room
  messages: Message[],  // Array of messages in the room
  media: Media[],       // Array of media files in the room
  _count: {             // Stats
    users: number,
    messages: number,
    media: number
  }
}
```

**Message Object**:
```javascript
{
  id: string,           // UUID
  content: string,      // Required
  userId: string,       // UUID reference to User
  roomId: string,       // UUID reference to Room
  createdAt: Date,
  updatedAt: Date,
  user: User            // User who sent the message
}
```

**Media Object**:
```javascript
{
  id: string,           // UUID
  url: string,          // Required
  type: MediaType,      // 'IMAGE' or 'VIDEO'
  userId: string,       // UUID reference to User
  roomId: string,       // UUID reference to Room
  createdAt: Date,
  updatedAt: Date,
  user: User,           // User who uploaded the media
  room: Room            // Room where media was uploaded
}
```

**AI Query Object**:
```javascript
{
  id: string,           // UUID
  query: string,        // Required
  response: object,     // JSON response from AI
  userId: string,       // UUID reference to User
  createdAt: Date,
  updatedAt: Date,
  user: User            // User who made the query
}
```

## Testing Your Integration

### 1. Authentication Testing
```javascript
describe('Authentication', () => {
  test('should register a new user', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };
    
    const response = await registerUser(userData);
    
    expect(response.user.username).toBe(userData.username);
    expect(response.token).toBeDefined();
  });
  
  test('should login existing user', async () => {
    const credentials = {
      identifier: 'test@example.com',
      password: 'password123'
    };
    
    const response = await loginUser(credentials);
    
    expect(response.user).toBeDefined();
    expect(response.token).toBeDefined();
  });
});
```

### 2. Room Management Testing
```javascript
describe('Room Management', () => {
  test('should create a room', async () => {
    const roomData = {
      name: 'Test Room',
      description: 'A test room',
      creatorId: 'user-uuid'
    };
    
    const response = await createRoom(roomData);
    
    expect(response.name).toBe(roomData.name);
    expect(response.id).toBeDefined();
  });
  
  test('should get all rooms', async () => {
    const rooms = await getRooms();
    
    expect(Array.isArray(rooms)).toBe(true);
    expect(rooms.length).toBeGreaterThan(0);
  });
});
```

### 3. WebSocket Testing
```javascript
describe('WebSocket Integration', () => {
  let socket;
  
  beforeEach(() => {
    socket = io('ws://localhost:3001');
  });
  
  afterEach(() => {
    socket.disconnect();
  });
  
  test('should connect to WebSocket', (done) => {
    socket.on('connect', () => {
      expect(socket.connected).toBe(true);
      done();
    });
  });
  
  test('should join a room', (done) => {
    socket.emit('join-room', { room_id: 'test-room', user_id: 'test-user' });
    
    socket.on('joined-room', (data) => {
      expect(data.room_id).toBe('test-room');
      expect(data.user_id).toBe('test-user');
      done();
    });
  });
});
```

### 4. Error Handling Testing
```javascript
describe('Error Handling', () => {
  test('should handle authentication errors', async () => {
    // Remove auth token
    localStorage.removeItem('authToken');
    
    try {
      await getUserProfile();
    } catch (error) {
      expect(error).toBeInstanceOf(AuthError);
    }
  });
  
  test('should handle validation errors', async () => {
    const invalidUserData = {
      username: '', // Empty username
      email: 'invalid-email',
      password: '123' // Too short
    };
    
    try {
      await registerUser(invalidUserData);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
    }
  });
});
```

### 5. Integration Test Checklist

- [ ] Test all authentication flows (register, login, profile)
- [ ] Test WebSocket connection and events
- [ ] Test room creation and joining
- [ ] Test message sending and receiving
- [ ] Test media upload and retrieval
- [ ] Test AI query submission
- [ ] Test error scenarios and edge cases
- [ ] Test authorization for protected endpoints
- [ ] Test pagination for list endpoints
- [ ] Test input validation and sanitization

This guide covers all the major microprocesses and endpoints in the EduSphere backend. Follow these patterns to ensure full integration with your frontend application.

## Troubleshooting

### Common Issues

**1. CORS Errors**
```
Access to fetch at 'http://localhost:3000/api' from origin 'http://localhost:3001' has been blocked by CORS policy
```
- **Solution**: Ensure backend CORS is configured for your frontend domain
- **Backend fix**: Update CORS configuration in main.ts or gateway

**2. WebSocket Connection Failed**
```
WebSocket connection failed
```
- **Solution**: Check WebSocket server is running on port 3001
- **Check**: Verify firewall settings allow WebSocket connections
- **Debug**: Use browser developer tools to inspect WebSocket connection

**3. Authentication Errors**
```
401 Unauthorized
```
- **Solution**: Ensure JWT token is included in Authorization header
- **Check**: Verify token hasn't expired
- **Debug**: Decode JWT token to check expiration

**4. Database Connection Issues**
```
Cannot connect to database
```
- **Solution**: Check DATABASE_URL environment variable
- **Check**: Ensure PostgreSQL is running
- **Debug**: Test database connection manually

### Debugging Tools

**API Testing**:
```bash
# Test registration
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Test login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"password123"}'

# Test authenticated endpoint
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**WebSocket Testing**:
```javascript
// Test WebSocket connection
const socket = io('ws://localhost:3001');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### Environment Variables Checklist

```bash
# Required for backend
DATABASE_URL=postgresql://username:password@localhost:5432/edusphere
JWT_SECRET=your-very-secure-secret-key-here
PORT=3000
NODE_ENV=development

# Optional
CORS_ORIGIN=http://localhost:3001
WEBSOCKET_PORT=3001
```

### Performance Optimization

**1. Pagination**
Always use pagination for list endpoints:
```javascript
// Good
const rooms = await fetch('/rooms?skip=0&take=20');

// Bad - loads all rooms
const rooms = await fetch('/rooms');
```

**2. Caching**
Cache frequently accessed data:
```javascript
const cache = new Map();

async function getCachedRooms() {
  const cacheKey = 'rooms';
  const cacheTime = 5 * 60 * 1000; // 5 minutes
  
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTime) {
    return cached.data;
  }
  
  const rooms = await fetch('/rooms');
  cache.set(cacheKey, { data: rooms, timestamp: Date.now() });
  
  return rooms;
}
```

**3. Debouncing**
Debounce search and typing indicators:
```javascript
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Usage for search
const debouncedSearch = debounce(async (query) => {
  const results = await fetch(`/search?q=${query}`);
  // Update UI with results
}, 300);

// Usage for typing indicator
const debouncedTyping = debounce((roomId, userId) => {
  socket.emit('typing', { room_id: roomId, user_id: userId, is_typing: false });
}, 1000);
```

## Useful Utilities

### 1. API Client Class
```javascript
class EduSphereClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.authManager = new AuthManager();
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.authManager.getToken();
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new APIError(errorData.message, response.status);
    }

    return response.json();
  }

  // Auth methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  // Room methods
  async getRooms(skip = 0, take = 20) {
    return this.request(`/rooms?skip=${skip}&take=${take}`);
  }

  async createRoom(roomData) {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData)
    });
  }

  // Message methods
  async sendMessage(roomId, content, userId) {
    return this.request(`/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, userId })
    });
  }

  // AI methods
  async submitQuery(query, userId) {
    return this.request('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query, userId })
    });
  }
}
```

### 2. WebSocket Manager
```javascript
class WebSocketManager {
  constructor(url = 'ws://localhost:3001') {
    this.url = url;
    this.socket = null;
    this.eventHandlers = new Map();
  }

  connect() {
    this.socket = io(this.url);
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.emit('connect');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.emit('disconnect');
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Set up event forwarding
    ['new-message', 'user-joined', 'user-left', 'user-typing'].forEach(event => {
      this.socket.on(event, (data) => this.emit(event, data));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId, userId) {
    if (this.socket) {
      this.socket.emit('join-room', { room_id: roomId, user_id: userId });
    }
  }

  sendMessage(roomId, userId, content) {
    if (this.socket) {
      this.socket.emit('send-message', { room_id: roomId, user_id: userId, content });
    }
  }

  setTyping(roomId, userId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { room_id: roomId, user_id: userId, is_typing: isTyping });
    }
  }

  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}
```

### 3. Form Validation Helper
```javascript
class FormValidator {
  constructor() {
    this.rules = {
      required: (value) => value && value.trim() !== '',
      email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      minLength: (min) => (value) => value && value.length >= min,
      maxLength: (max) => (value) => value && value.length <= max,
      pattern: (regex) => (value) => regex.test(value)
    };
  }

  validate(data, schema) {
    const errors = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      for (const [ruleName, ruleValue] of Object.entries(rules)) {
        const rule = typeof ruleValue === 'function' ? ruleValue : this.rules[ruleName];
        
        if (rule) {
          const isValid = typeof ruleValue === 'function' 
            ? rule(value) 
            : rule(ruleValue)(value);
            
          if (!isValid) {
            errors[field] = rules.message || `${field} is invalid`;
            break;
          }
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Usage
const validator = new FormValidator();

const userSchema = {
  username: {
    required: true,
    maxLength: 30,
    message: 'Username is required and must be less than 30 characters'
  },
  email: {
    required: true,
    email: true,
    message: 'Valid email is required'
  },
  password: {
    required: true,
    minLength: 6,
    message: 'Password must be at least 6 characters'
  }
};

const { isValid, errors } = validator.validate(userData, userSchema);
```

This comprehensive guide provides everything needed to integrate with the EduSphere backend successfully.