import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { PerformanceTracker } from '../../utils/test-helpers';

describe('EduSphere API Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Application Health', () => {
    it('should start the application successfully', async () => {
      expect(app).toBeDefined();
    });

    it('should have Prisma service available', () => {
      expect(prisma).toBeDefined();
    });

    it('should respond to health check endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .expect(200);

      expect(response.text).toContain('Hello World!');
    });
  });

  describe('Users API Integration', () => {
    let createdUserId: string;

    const testUser = {
      username: 'integrationtest',
      firstName: 'Integration',
      lastName: 'Test',
      email: 'integration@test.com',
      password: 'testpassword123',
    };

    it('should create a new user via API', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe(testUser.username);
      expect(response.body.email).toBe(testUser.email);
      createdUserId = response.body.id;
    });

    it('should retrieve all users via API', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should retrieve a specific user via API', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(200);

      expect(response.body.id).toBe(createdUserId);
      expect(response.body.username).toBe(testUser.username);
    });

    it('should update a user via API', async () => {
      const updateData = { firstName: 'UpdatedName' };

      const response = await request(app.getHttpServer())
        .patch(`/users/${createdUserId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.firstName).toBe('UpdatedName');
    });

    it('should delete a user via API (soft delete)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${createdUserId}`)
        .expect(200);

      expect(response.body.deletedAt).toBeDefined();
    });

    it('should return 404 for deleted user', async () => {
      await request(app.getHttpServer())
        .get(`/users/${createdUserId}`)
        .expect(404);
    });
  });

  describe('Rooms API Integration', () => {
    let createdRoomId: string;
    let testUserId: string;

    beforeAll(async () => {
      // Create a test user for room creation
      const testUser = {
        username: 'roomcreator',
        firstName: 'Room',
        lastName: 'Creator',
        email: 'roomcreator@test.com',
        password: 'password123',
      };

      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send(testUser);

      testUserId = userResponse.body.id;
    });

    const testRoom = {
      name: 'Integration Test Room',
      description: 'A room for integration testing',
      slug: 'integration-test-room',
    };

    it('should create a new room via API', async () => {
      const roomWithCreator = { ...testRoom, creatorId: testUserId };

      const response = await request(app.getHttpServer())
        .post('/rooms')
        .send(roomWithCreator)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testRoom.name);
      expect(response.body.slug).toBe(testRoom.slug);
      createdRoomId = response.body.id;
    });

    it('should retrieve all rooms via API', async () => {
      const response = await request(app.getHttpServer())
        .get('/rooms')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should retrieve a specific room via API', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rooms/${createdRoomId}`)
        .expect(200);

      expect(response.body.id).toBe(createdRoomId);
      expect(response.body.name).toBe(testRoom.name);
    });

    it('should update a room via API', async () => {
      const updateData = { name: 'Updated Room Name' };

      const response = await request(app.getHttpServer())
        .patch(`/rooms/${createdRoomId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe('Updated Room Name');
    });

    it('should delete a room via API (soft delete)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/rooms/${createdRoomId}`)
        .expect(200);

      expect(response.body.deletedAt).toBeDefined();
    });
  });

  describe('AI Queries API Integration', () => {
    let createdQueryId: string;
    let testUserId: string;

    beforeAll(async () => {
      // Create a test user for AI queries
      const testUser = {
        username: 'aiuser',
        firstName: 'AI',
        lastName: 'User',
        email: 'aiuser@test.com',
        password: 'password123',
      };

      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send(testUser);

      testUserId = userResponse.body.id;
    });

    const testQuery = {
      query: 'What is artificial intelligence?',
    };

    it('should create a new AI query via API', async () => {
      const queryWithUser = { ...testQuery, userId: testUserId };

      const response = await request(app.getHttpServer())
        .post('/ai')
        .send(queryWithUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.query).toBe(testQuery.query);
      expect(response.body.userId).toBe(testUserId);
      createdQueryId = response.body.id;
    });

    it('should retrieve all AI queries via API', async () => {
      const response = await request(app.getHttpServer())
        .get('/ai')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should retrieve a specific AI query via API', async () => {
      const response = await request(app.getHttpServer())
        .get(`/ai/${createdQueryId}`)
        .expect(200);

      expect(response.body.id).toBe(createdQueryId);
      expect(response.body.query).toBe(testQuery.query);
    });

    it('should delete an AI query via API (soft delete)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/ai/${createdQueryId}`)
        .expect(200);

      expect(response.body.deletedAt).toBeDefined();
    });
  });

  describe('Performance Integration Tests', () => {
    it('should handle concurrent user creation requests', async () => {
      const { metrics } = await PerformanceTracker.measure(async () => {
        const promises = Array.from({ length: 10 }, (_, i) =>
          request(app.getHttpServer())
            .post('/users')
            .send({
              username: `concurrentuser${i}`,
              firstName: 'Concurrent',
              lastName: `User${i}`,
              email: `concurrent${i}@test.com`,
              password: 'password123',
            })
        );

        const responses = await Promise.all(promises);
        return responses;
      });

      // 10 concurrent user creations should complete within 2 seconds
      expect(metrics.timeMs).toBeLessThan(2000);
    });

    it('should handle large room listing requests efficiently', async () => {
      // Create multiple rooms first
      const roomPromises = Array.from({ length: 20 }, (_, i) =>
        request(app.getHttpServer())
          .post('/rooms')
          .send({
            name: `Performance Room ${i}`,
            description: `Room for performance testing ${i}`,
            slug: `performance-room-${i}`,
            creatorId: 'default-creator-id',
          })
      );

      await Promise.all(roomPromises);

      const { metrics } = await PerformanceTracker.measure(async () => {
        return request(app.getHttpServer()).get('/rooms');
      });

      // Retrieving all rooms should be fast
      expect(metrics.timeMs).toBeLessThan(1000);
    });

    it('should handle API response times within acceptable limits', async () => {
      const endpoints = [
        { method: 'get', path: '/' },
        { method: 'get', path: '/users' },
        { method: 'get', path: '/rooms' },
        { method: 'get', path: '/ai' },
      ];

      for (const endpoint of endpoints) {
        const { metrics } = await PerformanceTracker.measure(async () => {
          return request(app.getHttpServer())[endpoint.method](endpoint.path);
        });

        // All GET endpoints should respond within 500ms
        expect(metrics.timeMs).toBeLessThan(500);
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid JSON gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle missing required fields', async () => {
      const incompleteUser = {
        username: 'incomplete',
        // missing other required fields
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle non-existent resources', async () => {
      const nonExistentId = 'non-existent-id-12345';

      await request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/rooms/${nonExistentId}`)
        .expect(404);

      await request(app.getHttpServer())
        .get(`/ai/${nonExistentId}`)
        .expect(404);
    });

    it('should handle invalid UUIDs', async () => {
      const invalidId = 'invalid-uuid';

      const response = await request(app.getHttpServer())
        .get(`/users/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Data Consistency Integration', () => {
    it('should maintain referential integrity between users and rooms', async () => {
      // Create a user
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'roomowner',
          firstName: 'Room',
          lastName: 'Owner',
          email: 'roomowner@test.com',
          password: 'password123',
        });

      // Create a room with this user as creator
      const room = await request(app.getHttpServer())
        .post('/rooms')
        .send({
          name: 'User Room',
          description: 'Room created by user',
          slug: 'user-room',
          creatorId: user.body.id,
        });

      expect(room.body.creatorId).toBe(user.body.id);

      // Verify the relationship is maintained when fetching the room
      const fetchedRoom = await request(app.getHttpServer())
        .get(`/rooms/${room.body.id}`);

      expect(fetchedRoom.body.creatorId).toBe(user.body.id);
    });

    it('should maintain consistency between users and AI queries', async () => {
      // Create a user
      const user = await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'aiqueryer',
          firstName: 'AI',
          lastName: 'Queryer',
          email: 'aiqueryer@test.com',
          password: 'password123',
        });

      // Create an AI query by this user
      const query = await request(app.getHttpServer())
        .post('/ai')
        .send({
          query: 'What is data consistency?',
          userId: user.body.id,
        });

      expect(query.body.userId).toBe(user.body.id);

      // Verify the relationship is maintained when fetching the query
      const fetchedQuery = await request(app.getHttpServer())
        .get(`/ai/${query.body.id}`);

      expect(fetchedQuery.body.userId).toBe(user.body.id);
    });
  });

  describe('Security Integration Tests', () => {
    it('should handle SQL injection attempts in API requests', async () => {
      const maliciousData = {
        username: "'; DROP TABLE users; --",
        firstName: 'Malicious',
        lastName: 'User',
        email: 'malicious@test.com',
        password: 'password123',
      };

      // The API should handle this gracefully without causing database issues
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(maliciousData);

      // Either succeeds (if properly sanitized) or fails safely
      expect([200, 201, 400, 422]).toContain(response.status);
    });

    it('should handle XSS attempts in user input', async () => {
      const xssData = {
        username: 'xssuser',
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        email: 'xss@test.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(xssData);

      // Check that if the user is created, the XSS is either escaped or sanitized
      if (response.status === 201) {
        expect(response.body.firstName).not.toContain('<script>');
      }
    });

    it('should validate input lengths and constraints', async () => {
      const oversizedData = {
        username: 'a'.repeat(1000), // Very long username
        firstName: 'Test',
        lastName: 'User',
        email: 'valid@test.com',
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(oversizedData);

      // Should reject oversized input
      expect(response.status).toBe(400);
    });
  });
});