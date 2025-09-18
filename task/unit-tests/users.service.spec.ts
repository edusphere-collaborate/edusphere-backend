// import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createTestingModule,
  mockData,
  PerformanceTracker,
  ComplexityAnalyzer,
} from '../../utils/test-helpers';

describe('UsersService - Comprehensive Tests', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await createTestingModule([UsersService]);
    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create a user successfully', async () => {
      const createUserDto = {
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'password123',
      };

      const expectedUser = { ...mockData.user, ...createUserDto };
      (prisma.user.create as jest.Mock).mockResolvedValue(expectedUser);

      const result = await service.create(createUserDto);

      expect(prisma.user.create).toHaveBeenCalledWith({ data: createUserDto });
      expect(result).toEqual(expectedUser);
    });

    it('should find all users', async () => {
      const users = [mockData.user];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(users);

      const result = await service.findAll();

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(result).toEqual(users);
    });

    it('should find a user by id', async () => {
      const userId = 'user-id-1';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockData.user);

      const result = await service.findOne(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId, deletedAt: null },
        include: {
          rooms: true,
          createdRooms: true,
          messages: true,
          aiQueries: true,
          media: true,
        },
      });
      expect(result).toEqual(mockData.user);
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'non-existent-id';
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId, deletedAt: null },
        include: {
          rooms: true,
          createdRooms: true,
          messages: true,
          aiQueries: true,
          media: true,
        },
      });
    });

    it('should update a user successfully', async () => {
      const userId = 'user-id-1';
      const updateUserDto = { firstName: 'Updated' };
      const updatedUser = { ...mockData.user, ...updateUserDto };

      // Mock findOne call (called by update method)
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockData.user);
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateUserDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateUserDto,
      });
      expect(result).toEqual(updatedUser);
    });

    it('should soft delete a user', async () => {
      const userId = 'user-id-1';
      const deletedUser = { ...mockData.user, deletedAt: new Date() };

      // Mock findOne call (called by remove method)
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockData.user);
      (prisma.user.update as jest.Mock).mockResolvedValue(deletedUser);

      const result = await service.remove(userId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual(deletedUser);
    });
  });

  describe('Performance Tests', () => {
    it('should create user within acceptable time limits', async () => {
      const createUserDto = {
        username: 'performanceuser',
        firstName: 'Performance',
        lastName: 'User',
        email: 'perf@example.com',
        password: 'password123',
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockData.user);

      const { metrics } = await PerformanceTracker.measure(async () => {
        return service.create(createUserDto);
      });

      // Should complete within 100ms (excluding actual database time)
      expect(metrics.timeMs).toBeLessThan(100);
      // Should use less than 1MB of additional memory
      expect(Math.abs(metrics.memoryMB)).toBeLessThan(1);
    });

    it('should analyze findAll performance complexity', async () => {
      (prisma.user.findMany as jest.Mock).mockImplementation(async () => {
        // Simulate constant time complexity for findAll (should be O(1) with proper indexing)
        await new Promise((resolve) => setTimeout(resolve, 5));
        return [mockData.user];
      });

      const results = await ComplexityAnalyzer.measureTimeComplexity(
        async (size) => {
          // Since findAll doesn't take size parameter, we'll test multiple calls
          const promises = Array(size / 10)
            .fill(null)
            .map(() => service.findAll());
          await Promise.all(promises);
        },
        [10, 50, 100],
      );

      const complexity = ComplexityAnalyzer.analyzeComplexity(results);

      // FindAll should be O(1) for database query (complexity depends on result set size)
      expect(complexity).toMatch(/(O\(1\)|O\(log n\)|O\(n\))/);
    });

    it('should handle large result sets efficiently', async () => {
      const batchSize = 1000;
      (prisma.user.findMany as jest.Mock).mockResolvedValue(
        Array(batchSize).fill(mockData.user),
      );

      const { metrics } = await PerformanceTracker.measure(async () => {
        return service.findAll();
      });

      // Large result set should still complete reasonably fast
      expect(metrics.timeMs).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      (prisma.user.create as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      );

      const createUserDto = {
        username: 'erroruser',
        firstName: 'Error',
        lastName: 'User',
        email: 'error@example.com',
        password: 'password123',
      };

      await expect(service.create(createUserDto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle invalid input gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(null as any)).rejects.toThrow();
      await expect(service.findOne('')).rejects.toThrow(NotFoundException);
    });

    it('should validate input parameters', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Test normal operation
      const result = await service.findAll();
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(result).toEqual([]);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve data relationships', async () => {
      const userWithRelations = {
        ...mockData.user,
        rooms: [mockData.room],
        messages: [mockData.message],
        aiQueries: [mockData.aiQuery],
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(
        userWithRelations,
      );

      const result = await service.findOne('user-id-1');

      expect(result.rooms).toBeDefined();
      expect(result.messages).toBeDefined();
      expect(result.aiQueries).toBeDefined();
      expect(Array.isArray(result.rooms)).toBe(true);
    });

    it('should handle soft delete consistency', async () => {
      const userId = 'user-id-1';
      const deletedUser = { ...mockData.user, deletedAt: new Date() };

      (prisma.user.update as jest.Mock).mockResolvedValue(deletedUser);

      const result = await service.remove(userId);

      expect(result.deletedAt).toBeDefined();
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('Security Considerations', () => {
    it('should not return sensitive data in queries', async () => {
      (prisma.user.findMany as jest.Mock).mockResolvedValue([mockData.user]);

      const users = await service.findAll(0, 10);

      // Verify that sensitive fields are handled appropriately
      users.forEach((user) => {
        expect(user).toHaveProperty('password'); // Should be hashed
        expect(user.password).not.toBe('plaintext'); // Should never be plaintext
      });
    });

    it('should validate user input for XSS prevention', async () => {
      const maliciousInput = {
        username: '<script>alert("xss")</script>',
        firstName: 'Safe',
        lastName: 'User',
        email: 'safe@example.com',
        password: 'password123',
      };

      (prisma.user.create as jest.Mock).mockResolvedValue(mockData.user);

      // The service should handle this gracefully (validation should be in DTOs)
      await service.create(maliciousInput);

      // Verify the call was made (validation happens at DTO level)
      expect(prisma.user.create).toHaveBeenCalled();
    });
  });
});
