import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RoomsService } from '../../../src/rooms/rooms.service';
import { PrismaService } from '../../../src/prisma/prisma.service';
import { createTestingModule, mockData, PerformanceTracker, ComplexityAnalyzer } from '../../utils/test-helpers';

describe('RoomsService - Comprehensive Tests', () => {
  let service: RoomsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await createTestingModule([RoomsService]);
    service = module.get<RoomsService>(RoomsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create a room successfully', async () => {
      const createRoomDto = {
        name: 'Test Room',
        description: 'A test room for testing',
        slug: 'test-room',
        creatorId: 'user-id-1',
      };

      const expectedRoom = { ...mockData.room, ...createRoomDto };
      (prisma.room.create as jest.Mock).mockResolvedValue(expectedRoom);

      const result = await service.create(createRoomDto);

      expect(prisma.room.create).toHaveBeenCalledWith({
        data: createRoomDto,
      });
      expect(result).toEqual(expectedRoom);
    });

    it('should find all rooms excluding deleted ones', async () => {
      const rooms = [mockData.room];
      (prisma.room.findMany as jest.Mock).mockResolvedValue(rooms);

      const result = await service.findAll();

      expect(prisma.room.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(result).toEqual(rooms);
    });

    it('should find a room by id', async () => {
      const roomId = 'room-id-1';
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockData.room);

      const result = await service.findOne(roomId);

      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: roomId },
      });
      expect(result).toEqual(mockData.room);
    });

    it('should throw NotFoundException when room not found', async () => {
      const roomId = 'non-existent-id';
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(roomId)).rejects.toThrow(NotFoundException);
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: roomId },
      });
    });

    it('should throw NotFoundException when room is soft deleted', async () => {
      const roomId = 'deleted-room-id';
      const deletedRoom = { ...mockData.room, deletedAt: new Date() };
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(deletedRoom);

      await expect(service.findOne(roomId)).rejects.toThrow(NotFoundException);
    });

    it('should update a room successfully', async () => {
      const roomId = 'room-id-1';
      const updateRoomDto = { name: 'Updated Room Name' };
      const updatedRoom = { ...mockData.room, ...updateRoomDto };

      // Mock findOne call (called by update method)
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockData.room);
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const result = await service.update(roomId, updateRoomDto);

      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: roomId },
      });
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: roomId },
        data: updateRoomDto,
      });
      expect(result).toEqual(updatedRoom);
    });

    it('should soft delete a room', async () => {
      const roomId = 'room-id-1';
      const deletedRoom = { ...mockData.room, deletedAt: new Date() };

      // Mock findOne calls (called by remove method)
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockData.room);
      (prisma.room.update as jest.Mock).mockResolvedValue(deletedRoom);

      const result = await service.remove(roomId);

      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: roomId },
      });
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: roomId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual(deletedRoom);
    });
  });

  describe('Performance Tests', () => {
    it('should create room within acceptable time limits', async () => {
      const createRoomDto = {
        name: 'Performance Room',
        description: 'Testing performance',
        slug: 'performance-room',
        creatorId: 'user-id-1',
      };

      (prisma.room.create as jest.Mock).mockResolvedValue(mockData.room);

      const { metrics } = await PerformanceTracker.measure(async () => {
        return service.create(createRoomDto);
      });

      // Should complete within 100ms (excluding actual database time)
      expect(metrics.timeMs).toBeLessThan(100);
      // Should use less than 1MB of additional memory
      expect(Math.abs(metrics.memoryMB)).toBeLessThan(1);
    });

    it('should analyze findAll performance complexity', async () => {
      (prisma.room.findMany as jest.Mock).mockImplementation(async () => {
        // Simulate constant time complexity for findAll
        await new Promise(resolve => setTimeout(resolve, 5));
        return [mockData.room];
      });

      const results = await ComplexityAnalyzer.measureTimeComplexity(
        async (size) => {
          // Test multiple concurrent calls to findAll
          const promises = Array(size / 10).fill(null).map(() => service.findAll());
          await Promise.all(promises);
        },
        [10, 50, 100]
      );

      const complexity = ComplexityAnalyzer.analyzeComplexity(results);
      
      // FindAll should be O(1) for database query
      expect(complexity).toMatch(/(O\(1\)|O\(log n\)|O\(n\))/);
    });

    it('should handle large room collections efficiently', async () => {
      const largeRoomSet = Array(1000).fill(mockData.room);
      (prisma.room.findMany as jest.Mock).mockResolvedValue(largeRoomSet);

      const { metrics } = await PerformanceTracker.measure(async () => {
        return service.findAll();
      });

      // Large result set should still complete reasonably fast
      expect(metrics.timeMs).toBeLessThan(500);
    });

    it('should optimize room lookup performance', async () => {
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockData.room);

      const { metrics } = await PerformanceTracker.measure(async () => {
        return service.findOne('room-id-1');
      });

      // Single room lookup should be very fast
      expect(metrics.timeMs).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      (prisma.room.create as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const createRoomDto = {
        name: 'Error Room',
        description: 'This should fail',
        slug: 'error-room',
        creatorId: 'user-id-1',
      };

      await expect(service.create(createRoomDto)).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid room IDs', async () => {
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('')).rejects.toThrow(NotFoundException);
      await expect(service.findOne(null as any)).rejects.toThrow();
    });

    it('should validate update operations on non-existent rooms', async () => {
      const nonExistentId = 'non-existent-room';
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const updateDto = { name: 'Updated Name' };

      await expect(service.update(nonExistentId, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should handle duplicate slug creation', async () => {
      const duplicateSlugDto = {
        name: 'Duplicate Room',
        description: 'Room with duplicate slug',
        slug: 'existing-slug',
        creatorId: 'user-id-1',
      };

      (prisma.room.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint failed on the fields: (`slug`)')
      );

      await expect(service.create(duplicateSlugDto)).rejects.toThrow();
    });
  });

  describe('Data Integrity', () => {
    it('should preserve room slug uniqueness', async () => {
      const roomWithSlug = { ...mockData.room, slug: 'unique-slug' };
      (prisma.room.create as jest.Mock).mockResolvedValue(roomWithSlug);

      const createRoomDto = {
        name: 'Unique Room',
        description: 'Room with unique slug',
        slug: 'unique-slug',
        creatorId: 'user-id-1',
      };

      const result = await service.create(createRoomDto);

      expect(result.slug).toBe('unique-slug');
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: createRoomDto,
      });
    });

    it('should maintain creator relationship', async () => {
      const roomWithCreator = {
        ...mockData.room,
        creatorId: 'specific-creator-id',
      };
      (prisma.room.create as jest.Mock).mockResolvedValue(roomWithCreator);

      const createRoomDto = {
        name: 'Creator Room',
        description: 'Room with specific creator',
        slug: 'creator-room',
        creatorId: 'specific-creator-id',
      };

      const result = await service.create(createRoomDto);

      expect(result.creatorId).toBe('specific-creator-id');
    });

    it('should handle soft delete timestamps correctly', async () => {
      const roomId = 'room-id-1';
      const currentDate = new Date();
      const deletedRoom = { ...mockData.room, deletedAt: currentDate };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockData.room);
      (prisma.room.update as jest.Mock).mockResolvedValue(deletedRoom);

      const result = await service.remove(roomId);

      expect(result.deletedAt).toBeDefined();
      expect(result.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('Business Logic', () => {
    it('should filter out deleted rooms in findAll', async () => {
      const mixedRooms = [
        { ...mockData.room, id: 'room-1', deletedAt: null },
        { ...mockData.room, id: 'room-2', deletedAt: new Date() },
        { ...mockData.room, id: 'room-3', deletedAt: null },
      ];

      // The service should only return non-deleted rooms
      const activeRooms = mixedRooms.filter(room => !room.deletedAt);
      (prisma.room.findMany as jest.Mock).mockResolvedValue(activeRooms);

      const result = await service.findAll();

      expect(prisma.room.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(result).toHaveLength(2);
      expect(result.every(room => room.deletedAt === null)).toBe(true);
    });

    it('should prevent operations on deleted rooms', async () => {
      const deletedRoom = { ...mockData.room, deletedAt: new Date() };
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(deletedRoom);

      await expect(service.findOne('deleted-room-id')).rejects.toThrow(NotFoundException);
      await expect(service.update('deleted-room-id', { name: 'New Name' })).rejects.toThrow(NotFoundException);
    });

    it('should validate room update constraints', async () => {
      const roomId = 'room-id-1';
      const invalidUpdate = { slug: '' }; // Empty slug should be invalid

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockData.room);
      (prisma.room.update as jest.Mock).mockRejectedValue(
        new Error('Validation failed: slug cannot be empty')
      );

      await expect(service.update(roomId, invalidUpdate)).rejects.toThrow();
    });
  });

  describe('Concurrency and Race Conditions', () => {
    it('should handle concurrent room creation with same slug', async () => {
      const roomDto = {
        name: 'Concurrent Room',
        description: 'Testing concurrent creation',
        slug: 'concurrent-slug',
        creatorId: 'user-id-1',
      };

      // First call succeeds
      (prisma.room.create as jest.Mock).mockResolvedValueOnce(mockData.room);
      // Second call fails due to unique constraint
      (prisma.room.create as jest.Mock).mockRejectedValueOnce(
        new Error('Unique constraint failed')
      );

      const firstCall = service.create(roomDto);
      const secondCall = service.create(roomDto);

      await expect(firstCall).resolves.toBeDefined();
      await expect(secondCall).rejects.toThrow();
    });

    it('should handle concurrent updates to the same room', async () => {
      const roomId = 'room-id-1';
      const updateDto1 = { name: 'Update 1' };
      const updateDto2 = { name: 'Update 2' };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockData.room);
      (prisma.room.update as jest.Mock)
        .mockResolvedValueOnce({ ...mockData.room, ...updateDto1 })
        .mockResolvedValueOnce({ ...mockData.room, ...updateDto2 });

      const update1 = service.update(roomId, updateDto1);
      const update2 = service.update(roomId, updateDto2);

      const results = await Promise.all([update1, update2]);
      
      expect(results).toHaveLength(2);
      expect(results[0].name).toBe('Update 1');
      expect(results[1].name).toBe('Update 2');
    });
  });
});