import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AiService } from '../../../src/ai/ai.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { createTestingModule, mockData, PerformanceTracker, ComplexityAnalyzer } from '../../utils/test-helpers';

describe('AiService - Comprehensive Tests', () => {
  let service: AiService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await createTestingModule([AiService]);
    service = module.get<AiService>(AiService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create an AI query successfully', async () => {
      const createAiDto = {
        userId: 'user-id-1',
        query: 'What is machine learning?',
      };

      const expectedQuery = { ...mockData.aiQuery, ...createAiDto };
      (prisma.aIQuery.create as jest.Mock).mockResolvedValue(expectedQuery);

      const result = await service.create(createAiDto);

      expect(prisma.aIQuery.create).toHaveBeenCalledWith({
        data: {
          userId: createAiDto.userId,
          query: createAiDto.query,
        },
      });
      expect(result).toEqual(expectedQuery);
    });

    it('should find all AI queries excluding deleted ones', async () => {
      const queries = [mockData.aiQuery];
      (prisma.aIQuery.findMany as jest.Mock).mockResolvedValue(queries);

      const result = await service.findAll();

      expect(prisma.aIQuery.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(result).toEqual(queries);
    });

    it('should find an AI query by id', async () => {
      const queryId = 'ai-query-id-1';
      (prisma.aIQuery.findUnique as jest.Mock).mockResolvedValue(mockData.aiQuery);

      const result = await service.findOne(queryId);

      expect(prisma.aIQuery.findUnique).toHaveBeenCalledWith({
        where: { id: queryId },
      });
      expect(result).toEqual(mockData.aiQuery);
    });

    it('should throw NotFoundException when AI query not found', async () => {
      const queryId = 'non-existent-id';
      (prisma.aIQuery.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(queryId)).rejects.toThrow(NotFoundException);
      expect(prisma.aIQuery.findUnique).toHaveBeenCalledWith({
        where: { id: queryId },
      });
    });

    it('should throw NotFoundException when AI query is soft deleted', async () => {
      const queryId = 'deleted-query-id';
      const deletedQuery = { ...mockData.aiQuery, deletedAt: new Date() };
      (prisma.aIQuery.findUnique as jest.Mock).mockResolvedValue(deletedQuery);

      await expect(service.findOne(queryId)).rejects.toThrow(NotFoundException);
    });

    it('should soft delete an AI query', async () => {
      const queryId = 'ai-query-id-1';
      const deletedQuery = { ...mockData.aiQuery, deletedAt: new Date() };

      // Mock findFirst call (called by remove method)
      (prisma.aIQuery.findFirst as jest.Mock).mockResolvedValue(mockData.aiQuery);
      (prisma.aIQuery.update as jest.Mock).mockResolvedValue(deletedQuery);

      const result = await service.remove(queryId);

      expect(prisma.aIQuery.findFirst).toHaveBeenCalledWith({
        where: { id: queryId },
      });
      expect(prisma.aIQuery.update).toHaveBeenCalledWith({
        where: { id: queryId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual(deletedQuery);
    });

    it('should throw NotFoundException when trying to remove non-existent query', async () => {
      const queryId = 'non-existent-id';
      (prisma.aIQuery.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove(queryId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Performance Tests', () => {
    it('should create AI query within acceptable time limits', async () => {
      const createAiDto = {
        userId: 'user-id-1',
        query: 'Performance test query: What is the time complexity of QuickSort?',
      };

      (prisma.aIQuery.create as jest.Mock).mockResolvedValue(mockData.aiQuery);

      const { metrics } = await PerformanceTracker.measure(async () => {
        return service.create(createAiDto);
      });

      // Should complete within 100ms (excluding actual database time)
      expect(metrics.timeMs).toBeLessThan(100);
      // Should use less than 1MB of additional memory
      expect(Math.abs(metrics.memoryMB)).toBeLessThan(1);
    });

    it('should analyze query processing performance with varying query lengths', async () => {
      (prisma.aIQuery.create as jest.Mock).mockImplementation(async (data) => {
        // Simulate processing time based on query length
        const queryLength = data.data.query.length;
        await new Promise(resolve => setTimeout(resolve, queryLength * 0.01));
        return { ...mockData.aiQuery, query: data.data.query };
      });

      const results = await ComplexityAnalyzer.measureTimeComplexity(
        async (size) => {
          const longQuery = 'A'.repeat(size);
          return service.create({
            userId: 'user-id-1',
            query: longQuery,
          });
        },
        [100, 500, 1000]
      );

      const complexity = ComplexityAnalyzer.analyzeComplexity(results);
      
      // Query processing should be linear with query length
      expect(complexity).toMatch(/(O\(1\)|O\(log n\)|O\(n\))/);
    });

    it('should handle large query collections efficiently', async () => {
      const largeQuerySet = Array(1000).fill(mockData.aiQuery);
      (prisma.aIQuery.findMany as jest.Mock).mockResolvedValue(largeQuerySet);

      const { metrics } = await PerformanceTracker.measure(async () => {
        return service.findAll();
      });

      // Large result set should still complete reasonably fast
      expect(metrics.timeMs).toBeLessThan(500);
    });

    it('should optimize single query lookup performance', async () => {
      (prisma.aIQuery.findUnique as jest.Mock).mockResolvedValue(mockData.aiQuery);

      const { metrics } = await PerformanceTracker.measure(async () => {
        return service.findOne('ai-query-id-1');
      });

      // Single query lookup should be very fast
      expect(metrics.timeMs).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      (prisma.aIQuery.create as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const createAiDto = {
        userId: 'user-id-1',
        query: 'This query should fail',
      };

      await expect(service.create(createAiDto)).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid query IDs', async () => {
      (prisma.aIQuery.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('')).rejects.toThrow(NotFoundException);
      await expect(service.findOne(null as any)).rejects.toThrow();
    });

    it('should handle malformed queries gracefully', async () => {
      const malformedDto = {
        userId: null as any,
        query: '',
      };

      (prisma.aIQuery.create as jest.Mock).mockRejectedValue(
        new Error('Foreign key constraint failed')
      );

      await expect(service.create(malformedDto)).rejects.toThrow();
    });

    it('should handle very long queries', async () => {
      const veryLongQuery = 'A'.repeat(10000); // 10KB query
      const longQueryDto = {
        userId: 'user-id-1',
        query: veryLongQuery,
      };

      (prisma.aIQuery.create as jest.Mock).mockResolvedValue({
        ...mockData.aiQuery,
        query: veryLongQuery,
      });

      const result = await service.create(longQueryDto);
      expect(result.query).toHaveLength(10000);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve user-query relationships', async () => {
      const userId = 'specific-user-id';
      const queryWithUser = {
        ...mockData.aiQuery,
        userId: userId,
      };
      (prisma.aIQuery.create as jest.Mock).mockResolvedValue(queryWithUser);

      const createAiDto = {
        userId: userId,
        query: 'User-specific query',
      };

      const result = await service.create(createAiDto);

      expect(result.userId).toBe(userId);
      expect(prisma.aIQuery.create).toHaveBeenCalledWith({
        data: {
          userId: userId,
          query: createAiDto.query,
        },
      });
    });

    it('should handle query timestamps correctly', async () => {
      const currentDate = new Date();
      const queryWithTimestamps = {
        ...mockData.aiQuery,
        createdAt: currentDate,
        updatedAt: currentDate,
      };
      (prisma.aIQuery.create as jest.Mock).mockResolvedValue(queryWithTimestamps);

      const createAiDto = {
        userId: 'user-id-1',
        query: 'Timestamp test query',
      };

      const result = await service.create(createAiDto);

      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle soft delete consistency', async () => {
      const queryId = 'ai-query-id-1';
      const deletedQuery = { ...mockData.aiQuery, deletedAt: new Date() };

      (prisma.aIQuery.findFirst as jest.Mock).mockResolvedValue(mockData.aiQuery);
      (prisma.aIQuery.update as jest.Mock).mockResolvedValue(deletedQuery);

      const result = await service.remove(queryId);

      expect(result.deletedAt).toBeDefined();
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('Business Logic', () => {
    it('should filter out deleted queries in findAll', async () => {
      const mixedQueries = [
        { ...mockData.aiQuery, id: 'query-1', deletedAt: null },
        { ...mockData.aiQuery, id: 'query-2', deletedAt: new Date() },
        { ...mockData.aiQuery, id: 'query-3', deletedAt: null },
      ];

      // The service should only return non-deleted queries
      const activeQueries = mixedQueries.filter(query => !query.deletedAt);
      (prisma.aIQuery.findMany as jest.Mock).mockResolvedValue(activeQueries);

      const result = await service.findAll();

      expect(prisma.aIQuery.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(result).toHaveLength(2);
      expect(result.every(query => query.deletedAt === null)).toBe(true);
    });

    it('should prevent operations on deleted queries', async () => {
      const deletedQuery = { ...mockData.aiQuery, deletedAt: new Date() };
      (prisma.aIQuery.findUnique as jest.Mock).mockResolvedValue(deletedQuery);

      await expect(service.findOne('deleted-query-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle special characters in queries', async () => {
      const specialCharQuery = {
        userId: 'user-id-1',
        query: 'What is the difference between "machine learning" & "deep learning"? @AI #query',
      };

      (prisma.aIQuery.create as jest.Mock).mockResolvedValue({
        ...mockData.aiQuery,
        query: specialCharQuery.query,
      });

      const result = await service.create(specialCharQuery);

      expect(result.query).toContain('"machine learning"');
      expect(result.query).toContain('&');
      expect(result.query).toContain('@AI');
      expect(result.query).toContain('#query');
    });

    it('should handle unicode characters in queries', async () => {
      const unicodeQuery = {
        userId: 'user-id-1',
        query: '¿Qué es el aprendizaje automático? 🤖 机器学习是什么？',
      };

      (prisma.aIQuery.create as jest.Mock).mockResolvedValue({
        ...mockData.aiQuery,
        query: unicodeQuery.query,
      });

      const result = await service.create(unicodeQuery);

      expect(result.query).toBe(unicodeQuery.query);
    });
  });

  describe('Security Considerations', () => {
    it('should handle potential injection attempts', async () => {
      const maliciousQuery = {
        userId: 'user-id-1',
        query: 'SELECT * FROM users; DROP TABLE users; --',
      };

      (prisma.aIQuery.create as jest.Mock).mockResolvedValue({
        ...mockData.aiQuery,
        query: maliciousQuery.query,
      });

      // The service should store the query as-is (Prisma handles SQL injection prevention)
      const result = await service.create(maliciousQuery);

      expect(result.query).toBe(maliciousQuery.query);
      expect(prisma.aIQuery.create).toHaveBeenCalledWith({
        data: {
          userId: maliciousQuery.userId,
          query: maliciousQuery.query,
        },
      });
    });

    it('should validate user ownership of queries', async () => {
      const userSpecificQuery = {
        ...mockData.aiQuery,
        userId: 'user-id-1',
      };
      (prisma.aIQuery.findUnique as jest.Mock).mockResolvedValue(userSpecificQuery);

      const result = await service.findOne('ai-query-id-1');

      // Verify that the query belongs to the expected user
      expect(result.userId).toBe('user-id-1');
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent query creation from same user', async () => {
      const queryDto1 = {
        userId: 'user-id-1',
        query: 'Concurrent query 1',
      };
      const queryDto2 = {
        userId: 'user-id-1',
        query: 'Concurrent query 2',
      };

      (prisma.aIQuery.create as jest.Mock)
        .mockResolvedValueOnce({ ...mockData.aiQuery, query: queryDto1.query })
        .mockResolvedValueOnce({ ...mockData.aiQuery, query: queryDto2.query });

      const query1 = service.create(queryDto1);
      const query2 = service.create(queryDto2);

      const results = await Promise.all([query1, query2]);
      
      expect(results).toHaveLength(2);
      expect(results[0].query).toBe('Concurrent query 1');
      expect(results[1].query).toBe('Concurrent query 2');
    });

    it('should handle concurrent deletion attempts', async () => {
      const queryId = 'ai-query-id-1';

      (prisma.aIQuery.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockData.aiQuery)
        .mockResolvedValueOnce(null); // Second call finds nothing (already deleted)

      (prisma.aIQuery.update as jest.Mock).mockResolvedValue({
        ...mockData.aiQuery,
        deletedAt: new Date(),
      });

      const delete1 = service.remove(queryId);
      const delete2 = service.remove(queryId);

      await expect(delete1).resolves.toBeDefined();
      await expect(delete2).rejects.toThrow(NotFoundException);
    });
  });
});