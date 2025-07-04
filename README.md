# Edusphere-Backend
# 🌍 Edusphere Backend Documentation

## Empowering Education, Connecting Minds

**Edusphere App** is a nonprofit web-based platform designed to transform education in Ghana by fostering collaborative learning, providing AI-driven academic support, and enabling multimedia sharing. This document serves as a comprehensive guide for backend developers working on the Edusphere Backend, built with NestJS, Node.js, and PostgreSQL. It outlines the project’s objectives, system architecture, data model, API specifications, and development guidelines to ensure a robust, scalable, and secure backend.

---

## 1. Project Overview

### 1.1 Background
Edusphere addresses the challenges faced by Ghanaian students (ages 15–30) in accessing timely academic support and collaborative learning opportunities. Traditional learning methods often lack real-time interaction and personalized assistance, while existing digital platforms may be fragmented or lack advanced features like AI support. Edusphere aims to bridge these gaps by providing a unified platform that integrates discussion rooms, AI-driven query responses, and multimedia sharing, tailored to the needs of students and educators in Ghana.

### 1.2 Mission
To empower Ghanaian students by delivering a dynamic platform that facilitates collaborative learning, provides real-time AI-powered academic support, and supports multimedia content sharing to enhance educational outcomes.

### 1.3 Objectives
- **General Objective**: Develop a scalable backend to support collaborative learning and AI-driven assistance for an engaging educational experience.
- **Specific Objectives**:
  - Implement RESTful APIs for user management, discussion rooms, and multimedia handling.
  - Integrate real-time messaging using WebSockets for discussion rooms.
  - Enable AI-driven query processing for academic support.
  - Ensure data security with industry-standard encryption and authentication.

### 1.4 Target Audience
- **Primary Users**: Ghanaian students (high school, university, and professional learners).
- **Secondary Users**: Educators facilitating discussions or providing resources.
- **Demographics**: Ages 15–30, with access to internet-enabled devices, primarily in Ghana.

---

## 2. Core Features
The Edusphere Backend supports the following core features:
- **Discussion Rooms**: Real-time chat rooms for collaborative learning and peer discussions.
- **AI Assistant**: Instant, personalized academic support using NLP-driven query responses.
- **Multimedia Library**: Upload and share images/videos to enhance educational content.
- **User Profiles**: Manage personal details, preferences, and activity history securely.
- **Secure Authentication**: JWT-based login and registration with encrypted data protection.

---

## 3. System Architecture

### 3.1 Overview
The Edusphere Backend follows a modular, layered architecture built with NestJS and Node.js, using PostgreSQL for data persistence. It integrates with a React frontend via REST APIs and WebSockets, and supports AI query processing through NLP libraries.

### 3.2 Components
- **API Gateway**: Handles incoming HTTP requests and routes them to appropriate controllers.
- **Modules**:
  - **Auth Module**: Manages user registration, login, and JWT-based authentication.
  - **Rooms Module**: Handles creation, management, and messaging for discussion rooms.
  - **AI Module**: Processes academic queries using NLP libraries (e.g., Hugging Face Transformers, spaCy).
  - **Media Module**: Manages upload, storage, and retrieval of images and videos.
  - **Users Module**: Manages user profiles, preferences, and activity history.
- **WebSocket Gateway**: Enables real-time messaging for discussion rooms using Socket.IO.
- **Database**: PostgreSQL with TypeORM for structured data storage.
- **External Integrations**: Optional integration with external NLP APIs for advanced AI functionality.

### 3.3 Data Flow
- **HTTP Requests**: The frontend sends REST API requests (e.g., `POST /auth/login`) to the API Gateway, which routes to controllers and services.
- **WebSocket Events**: Real-time chat messages are broadcast via the WebSocket Gateway to connected clients.
- **Database Interactions**: Services use TypeORM to perform CRUD operations on PostgreSQL.
- **AI Processing**: The AI Module processes user queries and returns responses, either locally or via external APIs.
- **Security**: All data transmissions use HTTPS, with sensitive data (e.g., passwords) encrypted using AES-256.

### 3.4 Scalability Considerations
- **Database**: PostgreSQL supports scaling to thousands of users with indexing and partitioning.
- **Caching**: Implement Redis for caching frequent queries (e.g., room messages) to reduce database load.
- **Load Balancing**: Deploy on a cloud platform (e.g., Heroku, Render) with load balancers for high traffic.
- **AI Optimization**: Offload complex NLP processing to dedicated servers or APIs if needed.

---

## 4. Data Model

### 4.1 Entities
The backend uses a normalized PostgreSQL database with the following entities:
- **User**:
  - Attributes: id (Primary Key, Integer), username (String, Unique), email (String, Unique), password (String, Hashed), created_at (Timestamp).
  - Purpose: Stores user account details and authentication data.
- **Room**:
  - Attributes: id (Primary Key, Integer), name (String), creator_id (Foreign Key, References User.id), created_at (Timestamp).
  - Purpose: Represents discussion rooms for collaborative learning.
- **Message**:
  - Attributes: id (Primary Key, Integer), room_id (Foreign Key, References Room.id), user_id (Foreign Key, References User.id), content (Text), sent_at (Timestamp).
  - Purpose: Stores chat messages within discussion rooms.
- **Media**:
  - Attributes: id (Primary Key, Integer), room_id (Foreign Key, References Room.id), user_id (Foreign Key, References User.id), file_path (String), file_type (String, e.g., ‘image’, ‘video’), uploaded_at (Timestamp).
  - Purpose: Manages uploaded images and videos.
- **AIQuery**:
  - Attributes: id (Primary Key, Integer), user_id (Foreign Key, References User.id), query (Text), response (Text), created_at (Timestamp).
  - Purpose: Tracks user queries and AI-generated responses.

### 4.2 Relationships
- **One-to-Many**:
  - User to Room: One user can create multiple rooms.
  - Room to Message: One room contains multiple messages.
  - Room to Media: One room contains multiple media files.
  - User to Message: One user sends multiple messages.
  - User to Media: One user uploads multiple media files.
  - User to AIQuery: One user submits multiple AI queries.
- **Constraints**:
  - Unique constraints on User.username and User.email.
  - Foreign key constraints ensure referential integrity (e.g., room_id in Message references Room.id).
  - Cascade deletes for Messages and Media when a Room is deleted.

### 4.3 Normalization
The schema is normalized to the Third Normal Form (3NF) to eliminate redundancy and ensure data integrity.

---

## 5. API Specifications

### 5.1 Authentication APIs
- **POST /auth/register**:
  - Description: Register a new user.
  - Request Body: `{ username, email, password }`.
  - Response: `{ user: { id, username, email }, token }` (JWT).
- **POST /auth/login**:
  - Description: Authenticate a user and return a JWT.
  - Request Body: `{ email, password }`.
  - Response: `{ user: { id, username, email }, token }`.
- **GET /auth/profile**:
  - Description: Retrieve authenticated user’s profile.
  - Headers: Authorization: Bearer `<token>`.
  - Response: `{ id, username, email, created_at }`.

### 5.2 Rooms APIs
- **GET /rooms**:
  - Description: List all discussion rooms.
  - Response: `[{ id, name, creator_id, created_at }, ...]`.
- **POST /rooms**:
  - Description: Create a new discussion room.
  - Headers: Authorization: Bearer `<token>`.
  - Request Body: `{ name }`.
  - Response: `{ id, name, creator_id, created_at }`.
- **GET /rooms/:id**:
  - Description: Retrieve details of a specific room.
  - Response: `{ id, name, creator_id, messages: [{ id, content, user_id, sent_at }, ...] }`.
- **POST /rooms/:id/messages**:
  - Description: Send a message in a room.
  - Headers: Authorization: Bearer `<token>`.
  - Request Body: `{ content }`.
  - Response: `{ id, room_id, user_id, content, sent_at }`.

### 5.3 AI APIs
- **POST /ai/query**:
  - Description: Submit an academic query to the AI assistant.
  - Headers: Authorization: Bearer `<token>`.
  - Request Body: `{ query }`.
  - Response: `{ id, user_id, query, response, created_at }`.

### 5.4 Media APIs
- **POST /media**:
  - Description: Upload an image or video to a room.
  - Headers: Authorization: Bearer `<token>`.
  - Request Body: Form-data with file and `{ room_id, file_type }`.
  - Response: `{ id, room_id, user_id, file_path, file_type, uploaded_at }`.
- **GET /media/:room_id**:
  - Description: List media files in a room.
  - Response: `[{ id, room_id, user_id, file_path, file_type, uploaded_at }, ...]`.

### 5.5 Users APIs
- **GET /users/:id**:
  - Description: Retrieve a user’s public profile.
  - Response: `{ id, username, created_at }`.
- **PUT /users/:id**:
  - Description: Update authenticated user’s profile.
  - Headers: Authorization: Bearer `<token>`.
  - Request Body: `{ username, email }`.
  - Response: `{ id, username, email, created_at }`.

### 5.6 WebSocket Events
- **Event: join-room**:
  - Description: User joins a room.
  - Payload: `{ room_id, user_id }`.
  - Broadcast: `{ user_id, username }` to room participants.
- **Event: send-message**:
  - Description: User sends a message in a room.
  - Payload: `{ room_id, user_id, content }`.
  - Broadcast: `{ id, room_id, user_id, content, sent_at }` to room participants.

---

## 6. Technical Requirements

### 6.1 Tech Stack
- **Framework**: NestJS with Node.js for modular, scalable backend development.
- **Database**: PostgreSQL with TypeORM for ORM-based data management.
- **Authentication**: JWT with Passport for secure user authentication.
- **Real-Time**: Socket.IO for WebSocket-based chat functionality.
- **AI**: NLP libraries (e.g., Hugging Face Transformers, spaCy) for query processing.
- **Dependencies**:
  - `@nestjs/typeorm`, `typeorm`, `pg`: Database integration.
  - `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`: Authentication.
  - `socket.io`: Real-time messaging.
  - Optional: External NLP APIs (e.g., Hugging Face) for advanced AI.

### 6.2 Environment Variables
- `DATABASE_HOST`: PostgreSQL host (e.g., `localhost`).
- `DATABASE_PORT`: PostgreSQL port (e.g., `5432`).
- `DATABASE_USER`: Database username.
- `DATABASE_PASSWORD`: Database password.
- `DATABASE_NAME`: Database name (e.g., `edusphere`).
- `JWT_SECRET`: Secret key for JWT signing.
- `PORT`: Backend server port (e.g., `3000`).

### 6.3 Security
- **Authentication**: Use JWT for stateless authentication, with tokens expiring after 24 hours.
- **Encryption**: Implement HTTPS for all API requests; store passwords with bcrypt hashing and sensitive data with AES-256 encryption.
- **Input Validation**: Sanitize all inputs to prevent SQL injection and XSS attacks.
- **Access Control**: Role-based permissions for room moderators (e.g., mute, remove users).

---

## 7. Development Guidelines

### 7.1 Coding Standards
- Follow NestJS conventions for module, controller, and service organization.
- Use TypeScript for type safety and maintainable code.
- Adhere to ESLint and Prettier configurations for consistent code formatting.
- Write clear, descriptive commit messages (e.g., “Add user registration endpoint in AuthModule”).

### 7.2 Testing
- **Unit Tests**: Test individual services (e.g., AuthService, RoomsService) using `@nestjs/testing`.
- **Integration Tests**: Test API endpoints with mocked database connections.
- **End-to-End Tests**: Simulate user flows (e.g., register → join room → send message).
- Use Jest for testing framework and achieve at least 80% code coverage.

### 7.3 Version Control
- Use Git with a branching strategy:
  - `main`: Production-ready code.
  - `develop`: Integration branch for new features.
  - `feature/*`: Feature-specific branches (e.g., `feature/ai-query-endpoint`).
  - `bugfix/*`: Bug fix branches.
- Create pull requests for code reviews, requiring at least one approval before merging.

### 7.4 CI/CD
- Set up GitHub Actions for:
  - Linting and formatting checks on push/pull requests.
  - Running unit and integration tests.
  - Building and deploying to staging/production environments.
- Deploy to a cloud platform (e.g., Heroku, Render) with automatic scaling.

### 7.5 Documentation
- Maintain API documentation using Swagger (integrated with NestJS).
- Update this README with new endpoints or features as they are added.
- Include diagrams in a `docs/` folder:
  - Frontend Architecture: `docs/frontend-architecture.png`
  - Data Model: `docs/data-model.png`
  - Backend Architecture: `docs/backend-architecture.png`

---

## 8. Deployment

### 8.1 Hosting
- Deploy on a cloud platform like Heroku, Render, or AWS Elastic Beanstalk.
- Use a managed PostgreSQL service (e.g., Supabase, Neon) for database hosting.
- Configure a reverse proxy (e.g., Nginx) for load balancing and HTTPS termination.

### 8.2 Environment Setup
- Staging: Mirror production with a separate database for testing.
- Production: Optimize for performance with caching (Redis) and horizontal scaling.
- Monitor uptime and performance using tools like New Relic or Grafana.

### 8.3 Backup and Recovery
- Schedule daily database backups with automated scripts.
- Implement a disaster recovery plan to restore data from backups within 4 hours.

---

## 9. Roadmap

- **Q3 2025**: Develop core APIs (Auth, Rooms, Media) and WebSocket integration; beta launch with 100 student testers.
- **Q4 2025**: Implement AI Module with NLP integration; full platform launch.
- **Q1 2026**: Scale to 1,000+ users; add advanced AI features (e.g., contextual learning paths).
- **Q2 2026**: Introduce analytics for user engagement and performance tracking.

---

## 10. Contributing

We welcome contributions from developers passionate about education. To contribute:
1. Fork the repository.
2. Create a feature or bugfix branch following the naming convention (e.g., `feature/add-media-upload`).
3. Follow coding standards and include tests for new features.
4. Submit a pull request with a clear description of changes.
5. Address feedback during code reviews.

Check [issues](https://github.com/EdusphereApp/Edusphere-Backend/issues) for tasks or propose new features.

---

## 11. Contact

- **Email**: contact@edusphere.app
- **X**: [@EdusphereGhana](https://x.com/EdusphereGhana)
- **Website**: [edusphere.app](https://edusphere.app)
- **Issues**: [Report bugs or suggest features](https://github.com/EdusphereApp/Edusphere-Backend/issues)

---

## 12. License

This project is licensed under the [MIT License](LICENSE).

---

**Edusphere App** | Connecting Knowledge, Empowering Futures
