import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Mock Prisma Service for testing
 * Provides consistent mocking for all Prisma operations
 */
export class MockPrismaService {
  // User operations
  user = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Room operations
  room = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // AI Query operations
  aIQuery = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Media operations
  media = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Message operations
  message = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Transaction support
  $transaction = jest.fn();
  $connect = jest.fn();
  $disconnect = jest.fn();
}

/**
 * Creates a testing module with common providers
 * @param providers Additional providers to include
 * @returns TestingModule
 */
export async function createTestingModule(providers: any[] = []): Promise<TestingModule> {
  return Test.createTestingModule({
    providers: [
      ...providers,
      {
        provide: PrismaService,
        useClass: MockPrismaService,
      },
    ],
  }).compile();
}

/**
 * Creates mock data for testing
 */
export const mockData = {
  user: {
    id: 'user-id-1',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },

  room: {
    id: 'room-id-1',
    name: 'Test Room',
    description: 'A test room',
    slug: 'test-room',
    creatorId: 'user-id-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },

  aiQuery: {
    id: 'ai-query-id-1',
    query: 'What is the capital of France?',
    response: { answer: 'Paris' },
    userId: 'user-id-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },

  message: {
    id: 'message-id-1',
    content: 'Hello, this is a test message',
    userId: 'user-id-1',
    roomId: 'room-id-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  },
};

/**
 * Performance testing utilities
 */
export class PerformanceTracker {
  private startTime: number = 0;
  private memoryStart: number = 0;

  start() {
    this.startTime = Date.now();
    this.memoryStart = process.memoryUsage().heapUsed;
  }

  end(): { timeMs: number; memoryMB: number } {
    const timeMs = Date.now() - this.startTime;
    const memoryEnd = process.memoryUsage().heapUsed;
    const memoryMB = (memoryEnd - this.memoryStart) / 1024 / 1024;
    
    return { timeMs, memoryMB };
  }

  /**
   * Measures the performance of an async operation
   */
  static async measure<T>(operation: () => Promise<T>): Promise<{ result: T; metrics: { timeMs: number; memoryMB: number } }> {
    const tracker = new PerformanceTracker();
    tracker.start();
    const result = await operation();
    const metrics = tracker.end();
    return { result, metrics };
  }
}

/**
 * Test complexity analyzer
 */
export class ComplexityAnalyzer {
  /**
   * Measures time complexity by running operations with different input sizes
   */
  static async measureTimeComplexity(
    operation: (size: number) => Promise<any>,
    sizes: number[] = [10, 100, 1000]
  ): Promise<{ size: number; timeMs: number }[]> {
    const results: { size: number; timeMs: number }[] = [];
    
    for (const size of sizes) {
      const tracker = new PerformanceTracker();
      tracker.start();
      await operation(size);
      const { timeMs } = tracker.end();
      results.push({ size, timeMs });
    }
    
    return results;
  }

  /**
   * Analyzes the growth rate and estimates Big O complexity
   */
  static analyzeComplexity(results: { size: number; timeMs: number }[]): string {
    if (results.length < 2) return 'Insufficient data';

    const ratios: number[] = [];
    for (let i = 1; i < results.length; i++) {
      const timeRatio = results[i].timeMs / results[i-1].timeMs;
      const sizeRatio = results[i].size / results[i-1].size;
      ratios.push(timeRatio / sizeRatio);
    }

    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;

    if (avgRatio < 1.2) return 'O(1) - Constant';
    if (avgRatio < 2) return 'O(log n) - Logarithmic';
    if (avgRatio < 3) return 'O(n) - Linear';
    if (avgRatio < 10) return 'O(n log n) - Linearithmic';
    return 'O(n²) or worse - Quadratic+';
  }
}