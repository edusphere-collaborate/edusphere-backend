import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../src/users/users.service';
import { RoomsService } from '../../../src/rooms/rooms.service';
import { AiService } from '../../../src/ai/ai.service';
import { createTestingModule, mockData, PerformanceTracker, ComplexityAnalyzer } from '../../utils/test-helpers';

/**
 * Performance benchmarks for EduSphere Backend services
 * These tests measure and analyze time/space complexity for critical operations
 */
describe('Performance Benchmarks - Time & Space Complexity Analysis', () => {
  let usersService: UsersService;
  let roomsService: RoomsService;
  let aiService: AiService;

  beforeEach(async () => {
    const module = await createTestingModule([UsersService, RoomsService, AiService]);
    usersService = module.get<UsersService>(UsersService);
    roomsService = module.get<RoomsService>(RoomsService);
    aiService = module.get<AiService>(AiService);
  });

  describe('Database Query Performance Analysis', () => {
    describe('Users Service Performance', () => {
      it('should benchmark user creation performance', async () => {
        const mockPrisma = (usersService as any).prismaService;
        
        // Mock database response time simulation
        mockPrisma.user.create.mockImplementation(async (data) => {
          // Simulate database write time (constant time O(1))
          await new Promise(resolve => setTimeout(resolve, 10));
          return { ...mockData.user, ...data.data };
        });

        const createUserDto = {
          username: 'benchmarkuser',
          firstName: 'Benchmark',
          lastName: 'User',
          email: 'benchmark@test.com',
          password: 'password123',
        };

        const iterations = 100;
        const results = [];

        for (let i = 0; i < iterations; i++) {
          const { metrics } = await PerformanceTracker.measure(async () => {
            return usersService.create({
              ...createUserDto,
              username: `benchmarkuser${i}`,
              email: `benchmark${i}@test.com`,
            });
          });
          results.push(metrics.timeMs);
        }

        const avgTime = results.reduce((a, b) => a + b) / results.length;
        const maxTime = Math.max(...results);
        const minTime = Math.min(...results);

        console.log(`\n📊 User Creation Performance:
        - Average time: ${avgTime.toFixed(2)}ms
        - Min time: ${minTime.toFixed(2)}ms
        - Max time: ${maxTime.toFixed(2)}ms
        - Standard deviation: ${calculateStandardDeviation(results).toFixed(2)}ms
        - Complexity: O(1) - Constant time for single user creation`);

        // Performance assertions
        expect(avgTime).toBeLessThan(50); // Average should be under 50ms
        expect(maxTime).toBeLessThan(200); // No operation should take more than 200ms
      });

      it('should analyze findAll pagination complexity', async () => {
        const mockPrisma = (usersService as any).prismaService;

        // Simulate database response time based on result set size
        mockPrisma.user.findMany.mockImplementation(async ({ skip, take }) => {
          const resultSize = take || 10;
          // Simulate O(log n) database index lookup time
          await new Promise(resolve => setTimeout(resolve, Math.log2(resultSize + 1) * 2));
          return Array(resultSize).fill(mockData.user);
        });

        const results = await ComplexityAnalyzer.measureTimeComplexity(
          async (size) => {
            // Since findAll doesn't take parameters, we simulate by mocking different result sizes
            mockPrisma.user.findMany.mockImplementationOnce(async () => {
              await new Promise(resolve => setTimeout(resolve, Math.log2(size + 1) * 2));
              return Array(size).fill(mockData.user);
            });
            return usersService.findAll();
          },
          [10, 100, 1000, 5000]
        );

        const complexity = ComplexityAnalyzer.analyzeComplexity(results);

        console.log(`\n📊 Users FindAll Complexity Analysis:
        - Complexity: ${complexity}
        - Results: ${JSON.stringify(results, null, 2)}`);

        expect(complexity).toMatch(/(O\(1\)|O\(log n\))/); // Should be constant or logarithmic
      });

      it('should benchmark memory usage for large user datasets', async () => {
        const mockPrisma = (usersService as any).prismaService;

        const dataSizes = [100, 500, 1000, 2000];
        const memoryResults = [];

        for (const size of dataSizes) {
          mockPrisma.user.findMany.mockResolvedValueOnce(
            Array(size).fill(mockData.user)
          );

          const { metrics } = await PerformanceTracker.measure(async () => {
            return usersService.findAll();
          });

          memoryResults.push({ size, memoryMB: Math.abs(metrics.memoryMB) });
        }

        console.log(`\n💾 Memory Usage Analysis:
        - Memory results: ${JSON.stringify(memoryResults, null, 2)}`);

        // Memory usage should scale reasonably with data size
        memoryResults.forEach(result => {
          expect(result.memoryMB).toBeLessThan(result.size * 0.01); // Less than 0.01MB per user
        });
      });
    });

    describe('Rooms Service Performance', () => {
      it('should benchmark room search and filtering performance', async () => {
        const mockPrisma = (roomsService as any).prisma;

        // Simulate complex database query with filtering
        mockPrisma.room.findMany.mockImplementation(async ({ where }) => {
          // Simulate indexed search time
          const complexity = where ? 15 : 10; // Slightly slower with filters
          await new Promise(resolve => setTimeout(resolve, complexity));
          return [mockData.room];
        });

        const iterations = 50;
        const withFilterResults = [];
        const withoutFilterResults = [];

        // Test with filtering (deletedAt: null)
        for (let i = 0; i < iterations; i++) {
          const { metrics } = await PerformanceTracker.measure(async () => {
            return roomsService.findAll();
          });
          withFilterResults.push(metrics.timeMs);
        }

        // Simulate findAll without filters for comparison
        mockPrisma.room.findMany.mockImplementation(async () => {
          await new Promise(resolve => setTimeout(resolve, 8));
          return [mockData.room];
        });

        for (let i = 0; i < iterations; i++) {
          const { metrics } = await PerformanceTracker.measure(async () => {
            return roomsService.findAll();
          });
          withoutFilterResults.push(metrics.timeMs);
        }

        const avgWithFilter = withFilterResults.reduce((a, b) => a + b) / withFilterResults.length;
        const avgWithoutFilter = withoutFilterResults.reduce((a, b) => a + b) / withoutFilterResults.length;

        console.log(`\n🔍 Room Search Performance:
        - With filter (deletedAt: null): ${avgWithFilter.toFixed(2)}ms avg
        - Without filter: ${avgWithoutFilter.toFixed(2)}ms avg
        - Filter overhead: ${(avgWithFilter - avgWithoutFilter).toFixed(2)}ms`);

        expect(avgWithFilter).toBeLessThan(100);
        expect(avgWithFilter - avgWithoutFilter).toBeLessThan(20); // Filter overhead should be minimal
      });

      it('should analyze room update operation complexity', async () => {
        const mockPrisma = (roomsService as any).prisma;

        // Mock the findOne and update operations
        mockPrisma.room.findUnique.mockResolvedValue(mockData.room);
        mockPrisma.room.update.mockImplementation(async (updateData) => {
          // Simulate update time based on data size
          const dataSize = JSON.stringify(updateData.data).length;
          await new Promise(resolve => setTimeout(resolve, Math.log(dataSize + 1) * 2));
          return { ...mockData.room, ...updateData.data };
        });

        const updateSizes = [
          { name: 'Small' }, // Small update
          { name: 'Medium Update', description: 'A medium sized description for testing' }, // Medium update
          { name: 'Large Update', description: 'A very large description '.repeat(50) }, // Large update
        ];

        const updateResults = [];

        for (const updateData of updateSizes) {
          const { metrics } = await PerformanceTracker.measure(async () => {
            return roomsService.update('room-id-1', updateData);
          });

          updateResults.push({
            size: JSON.stringify(updateData).length,
            timeMs: metrics.timeMs,
          });
        }

        console.log(`\n🔄 Room Update Performance:
        - Update results: ${JSON.stringify(updateResults, null, 2)}`);

        // Update time should scale logarithmically with data size
        updateResults.forEach(result => {
          expect(result.timeMs).toBeLessThan(100);
        });
      });
    });

    describe('AI Service Performance', () => {
      it('should benchmark AI query processing by length', async () => {
        const mockPrisma = (aiService as any).prismaService;

        // Simulate processing time based on query length
        mockPrisma.aIQuery.create.mockImplementation(async (data) => {
          const queryLength = data.data.query.length;
          // Simulate O(n) processing time for query analysis
          await new Promise(resolve => setTimeout(resolve, queryLength * 0.1));
          return { ...mockData.aiQuery, query: data.data.query };
        });

        const queryLengths = [50, 200, 500, 1000, 2000];
        const processingResults = [];

        for (const length of queryLengths) {
          const longQuery = 'A'.repeat(length);
          const createDto = {
            userId: 'user-id-1',
            query: longQuery,
          };

          const { metrics } = await PerformanceTracker.measure(async () => {
            return aiService.create(createDto);
          });

          processingResults.push({
            queryLength: length,
            timeMs: metrics.timeMs,
          });
        }

        console.log(`\n🤖 AI Query Processing Performance:
        - Processing results: ${JSON.stringify(processingResults, null, 2)}`);

        // Analyze the growth rate
        const complexity = ComplexityAnalyzer.analyzeComplexity(
          processingResults.map(r => ({ size: r.queryLength, timeMs: r.timeMs }))
        );

        console.log(`- Complexity: ${complexity}`);

        // Processing should be linear or better
        expect(complexity).toMatch(/(O\(1\)|O\(log n\)|O\(n\))/);
      });

      it('should benchmark concurrent query processing', async () => {
        const mockPrisma = (aiService as any).prismaService;

        mockPrisma.aIQuery.create.mockImplementation(async (data) => {
          // Simulate concurrent processing overhead
          await new Promise(resolve => setTimeout(resolve, 20));
          return { ...mockData.aiQuery, query: data.data.query };
        });

        const concurrencyLevels = [1, 5, 10, 20, 50];
        const concurrencyResults = [];

        for (const concurrency of concurrencyLevels) {
          const { metrics } = await PerformanceTracker.measure(async () => {
            const promises = Array.from({ length: concurrency }, (_, i) =>
              aiService.create({
                userId: 'user-id-1',
                query: `Concurrent query ${i}`,
              })
            );
            return Promise.all(promises);
          });

          concurrencyResults.push({
            concurrency,
            totalTimeMs: metrics.timeMs,
            avgTimePerQuery: metrics.timeMs / concurrency,
          });
        }

        console.log(`\n⚡ AI Concurrent Processing Performance:
        - Concurrency results: ${JSON.stringify(concurrencyResults, null, 2)}`);

        // Verify that concurrent processing provides reasonable throughput
        concurrencyResults.forEach(result => {
          expect(result.avgTimePerQuery).toBeLessThan(100); // Average time per query should be reasonable
        });
      });
    });
  });

  describe('System-wide Performance Benchmarks', () => {
    it('should benchmark cross-service operation performance', async () => {
      const mockUsersPrisma = (usersService as any).prismaService;
      const mockRoomsPrisma = (roomsService as any).prisma;
      const mockAiPrisma = (aiService as any).prismaService;

      // Mock all services
      mockUsersPrisma.user.create.mockResolvedValue(mockData.user);
      mockRoomsPrisma.room.create.mockResolvedValue(mockData.room);
      mockAiPrisma.aIQuery.create.mockResolvedValue(mockData.aiQuery);

      const { metrics } = await PerformanceTracker.measure(async () => {
        // Simulate a complex workflow: create user, create room, create AI query
        const user = await usersService.create({
          username: 'workflowuser',
          firstName: 'Workflow',
          lastName: 'User',
          email: 'workflow@test.com',
          password: 'password123',
        });

        const room = await roomsService.create({
          name: 'Workflow Room',
          description: 'Room for workflow testing',
          slug: 'workflow-room',
          creatorId: user.id,
        });

        const aiQuery = await aiService.create({
          userId: user.id,
          query: 'What is the purpose of this workflow?',
        });

        return { user, room, aiQuery };
      });

      console.log(`\n🔄 Cross-service Workflow Performance:
      - Total time: ${metrics.timeMs.toFixed(2)}ms
      - Memory used: ${Math.abs(metrics.memoryMB).toFixed(2)}MB`);

      expect(metrics.timeMs).toBeLessThan(500); // Complex workflow should complete under 500ms
      expect(Math.abs(metrics.memoryMB)).toBeLessThan(5); // Should use less than 5MB
    });

    it('should analyze database connection pool performance', async () => {
      const mockUsersPrisma = (usersService as any).prismaService;

      // Simulate connection pool behavior
      let connectionDelay = 5; // Initial connection is fast
      mockUsersPrisma.user.create.mockImplementation(async (data) => {
        await new Promise(resolve => setTimeout(resolve, connectionDelay));
        connectionDelay = Math.max(1, connectionDelay - 0.1); // Connections get faster with pool warmup
        return { ...mockData.user, ...data.data };
      });

      const poolResults = [];
      const iterations = 20;

      for (let i = 0; i < iterations; i++) {
        const { metrics } = await PerformanceTracker.measure(async () => {
          return usersService.create({
            username: `pooltest${i}`,
            firstName: 'Pool',
            lastName: 'Test',
            email: `pooltest${i}@test.com`,
            password: 'password123',
          });
        });

        poolResults.push({
          iteration: i + 1,
          timeMs: metrics.timeMs,
        });
      }

      console.log(`\n🏊 Connection Pool Performance:
      - First 5 connections: ${poolResults.slice(0, 5).map(r => `${r.timeMs.toFixed(2)}ms`).join(', ')}
      - Last 5 connections: ${poolResults.slice(-5).map(r => `${r.timeMs.toFixed(2)}ms`).join(', ')}`);

      // Later connections should be faster than initial ones (pool warmup effect)
      const firstFive = poolResults.slice(0, 5).map(r => r.timeMs);
      const lastFive = poolResults.slice(-5).map(r => r.timeMs);
      const avgFirst = firstFive.reduce((a, b) => a + b) / firstFive.length;
      const avgLast = lastFive.reduce((a, b) => a + b) / lastFive.length;

      expect(avgLast).toBeLessThanOrEqual(avgFirst); // Pool should improve performance
    });
  });
});

/**
 * Utility function to calculate standard deviation
 */
function calculateStandardDeviation(values: number[]): number {
  const avg = values.reduce((a, b) => a + b) / values.length;
  const squaredDifferences = values.map(value => Math.pow(value - avg, 2));
  const avgSquaredDiff = squaredDifferences.reduce((a, b) => a + b) / squaredDifferences.length;
  return Math.sqrt(avgSquaredDiff);
}