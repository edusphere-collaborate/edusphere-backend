import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAiQueryDto } from './dto/create-ai.dto';

import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
import { response } from 'express';
@Injectable()
export class AiService {
  private readonly genAI: GoogleGenAI;
  constructor(private readonly prismaService: PrismaService) {
    this.genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
  }

  // Simple AI response generator (mock implementation)
  private generateAiResponse(query: string): string {
    const lowerQuery = query.toLowerCase();

    // Educational responses based on common query patterns
    if (
      lowerQuery.includes('math') ||
      lowerQuery.includes('calculation') ||
      lowerQuery.includes('algebra')
    ) {
      return 'I can help with mathematical concepts! For algebra problems, remember to isolate variables step by step. For calculations, double-check your order of operations (PEMDAS). What specific math topic would you like to explore?';
    } else if (
      lowerQuery.includes('science') ||
      lowerQuery.includes('biology') ||
      lowerQuery.includes('chemistry') ||
      lowerQuery.includes('physics')
    ) {
      return "Science is fascinating! Whether you're studying biology, chemistry, or physics, understanding fundamental principles is key. Break down complex concepts into smaller parts and always relate them to real-world examples. What scientific concept are you working on?";
    } else if (
      lowerQuery.includes('english') ||
      lowerQuery.includes('writing') ||
      lowerQuery.includes('essay') ||
      lowerQuery.includes('literature')
    ) {
      return 'For English and writing, focus on structure, clarity, and evidence. When writing essays, start with a strong thesis statement, use topic sentences for each paragraph, and support your arguments with examples. Which aspect of English are you studying?';
    } else if (
      lowerQuery.includes('history') ||
      lowerQuery.includes('historical')
    ) {
      return 'History helps us understand the present through the past. When studying historical events, look for causes, effects, and connections between different time periods. Timeline creation and cause-and-effect charts can be very helpful tools. What historical period interests you?';
    } else if (
      lowerQuery.includes('study') ||
      lowerQuery.includes('learn') ||
      lowerQuery.includes('help')
    ) {
      return 'Effective studying involves active learning techniques like summarizing, self-testing, and spaced repetition. Break your study sessions into focused blocks, take regular breaks, and connect new information to what you already know. What subject are you studying?';
    } else if (
      lowerQuery.includes('exam') ||
      lowerQuery.includes('test') ||
      lowerQuery.includes('preparation')
    ) {
      return 'Test preparation is crucial for success. Create a study schedule, practice with past papers, form study groups, and ensure you understand concepts rather than just memorizing. Get adequate sleep and eat well before exams. What exam are you preparing for?';
    } else {
      return `I understand you're asking about: "${query}". As an AI assistant for academic support, I'm here to help with your studies. Could you provide more specific details about the subject or topic you need help with? I can assist with explanations, study strategies, and academic guidance across various subjects.`;
    }
  }

  // Create an AI query with validation and optimization
  async create(createAiDto: CreateAiQueryDto) {
    // Validate input
    if (!createAiDto.userId || !createAiDto.query) {
      throw new Error('UserId and query are required');
    }

    // Sanitize and validate query length
    const sanitizedQuery = createAiDto.query.trim();
    if (sanitizedQuery.length === 0) {
      throw new Error('Query cannot be empty');
    }
    if (sanitizedQuery.length > 10000) {
      throw new Error('Query exceeds maximum length of 10,000 characters');
    }

    // Generate AI response
    const aiResponse = this.generateAiResponse(sanitizedQuery);

    return await this.prismaService.aIQuery.create({
      data: {
        userId: createAiDto.userId,
        query: sanitizedQuery,
        response: aiResponse,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Find all AI queries with pagination and optimization
  async findAll(skip: number = 0, take: number = 50) {
    // Validate and sanitize pagination parameters
    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100); // Max 100 per page

    return await this.prismaService.aIQuery.findMany({
      where: { deletedAt: null },
      skip: validatedSkip,
      take: validatedTake,
      orderBy: { createdAt: 'desc' }, // Most recent first
      select: {
        id: true,
        query: true,
        response: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Find one AI query by ID with optimization
  async findOne(id: string) {
    // Validate ID format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new NotFoundException(`Invalid AI query ID provided`);
    }

    const query = await this.prismaService.aIQuery.findUnique({
      where: { id: id.trim() },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!query || query.deletedAt) {
      throw new NotFoundException(`AI query with ID ${id} not found`);
    }

    return query;
  }

  // Find AI queries by user ID
  async findByUserId(userId: string, skip: number = 0, take: number = 50) {
    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100);

    return await this.prismaService.aIQuery.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      skip: validatedSkip,
      take: validatedTake,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        query: true,
        response: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prismaService.aIQuery.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException();
    }

    return await this.prismaService.aIQuery.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async handleQuery(query: string, userId: string) {
    const response = await this.genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: query }] }],
    });

    const answer = response.text ?? 'No response from AI';
    // Store the query and response in the database

    const savedResponse = await this.prismaService.aIQuery.create({
      data: {
        userId,
        query,
        response: answer,
      },
    });
    return {
      id: return {
      id: saved.id,
      user_id: saved.userId,
      query: saved.query,
      response: saved.response,
      created_at: saved.createdAt,
    };.id,
      user_id: return {
      id: saved.id,
      user_id: saved.userId,
      query: saved.query,
      response: saved.response,
      created_at: saved.createdAt,
    };.userId,
      query: return {
      id: saved.id,
      user_id: saved.userId,
      query: saved.query,
      response: saved.response,
      created_at: saved.createdAt,
    };.query,
      response: return {
      id: saved.id,
      user_id: saved.userId,
      query: saved.query,
      response: saved.response,
      created_at: saved.createdAt,
    };.response,
      created_at: return {
      id: saved.id,
      user_id: saved.userId,
      query: saved.query,
      response: saved.response,
      created_at: saved.createdAt,
    };.createdAt,
    };
  }
}
