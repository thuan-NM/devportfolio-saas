// src/common/repositories/base.repository.ts
// Abstract generic repository using Prisma delegate pattern

import { PrismaService } from '../../core/prisma/prisma.service.js';
import { PrismaQueryHelper } from '../helpers/prisma-query.helper.js';
import type {
  PaginatedResult,
  QueryOptionsDto,
} from '../interfaces/query.interface.js';

/**
 * Abstract Base Repository
 * Provides generic CRUD operations with pagination, filtering, and sorting
 *
 * @template T - The entity type (e.g., Employee)
 * @template CreateInput - Prisma create input type (e.g., Prisma.EmployeeCreateInput)
 * @template UpdateInput - Prisma update input type (e.g., Prisma.EmployeeUpdateInput)
 */
export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  /**
   * The Prisma model name (lowercase) for dynamic access
   * Must be overridden in child classes
   */
  protected abstract readonly modelName: string;

  constructor(protected readonly prisma: PrismaService) {}

  /**
   * Get the Prisma delegate for the model
   * Uses dynamic access: this.prisma[modelName]
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected get model(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (this.prisma as any)[this.modelName];
  }

  /**
   * Find many records with pagination, filtering, and sorting
   */
  async findMany(options?: QueryOptionsDto): Promise<PaginatedResult<T>> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = PrismaQueryHelper.calculateSkip(page, limit);

    const where = options?.filters
      ? PrismaQueryHelper.buildWhere(options.filters)
      : {};

    const orderBy =
      options?.sort && options.sort.length > 0
        ? PrismaQueryHelper.buildOrderBy(options.sort)
        : [{ createdAt: 'desc' as const }]; // Default sort

    // Execute queries in parallel
    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.model.count({ where }),
    ]);

    return {
      data: data as T[],
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single record by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
    }) as Promise<T | null>;
  }

  /**
   * Find a single record by unique field
   */
  async findOne(where: Record<string, unknown>): Promise<T | null> {
    return this.model.findFirst({
      where,
    }) as Promise<T | null>;
  }

  /**
   * Create a new record
   */
  async create(data: CreateInput): Promise<T> {
    return this.model.create({
      data,
    }) as Promise<T>;
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: UpdateInput): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    }) as Promise<T>;
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id },
    }) as Promise<T>;
  }

  /**
   * Count records matching the filter
   */
  async count(options?: QueryOptionsDto): Promise<number> {
    const where = options?.filters
      ? PrismaQueryHelper.buildWhere(options.filters)
      : {};

    return this.model.count({ where });
  }
}
