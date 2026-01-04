// src/common/interfaces/query.interface.ts
// Core interfaces for the Generic Query Builder pattern

/**
 * Supported filter operators mapping to Prisma operators
 */
export enum FilterOperator {
    EQ = 'eq', // -> equals
    NE = 'ne', // -> not
    GT = 'gt', // -> gt
    GTE = 'gte', // -> gte
    LT = 'lt', // -> lt
    LTE = 'lte', // -> lte
    LIKE = 'like', // -> contains (mode: 'insensitive')
    IN = 'in', // -> in (array)
    NIN = 'nin', // -> notIn (array)
}

/**
 * Maps FilterOperator to Prisma operators
 */
export const OPERATOR_MAP: Record<FilterOperator, string> = {
    [FilterOperator.EQ]: 'equals',
    [FilterOperator.NE]: 'not',
    [FilterOperator.GT]: 'gt',
    [FilterOperator.GTE]: 'gte',
    [FilterOperator.LT]: 'lt',
    [FilterOperator.LTE]: 'lte',
    [FilterOperator.LIKE]: 'contains',
    [FilterOperator.IN]: 'in',
    [FilterOperator.NIN]: 'notIn',
};

/**
 * Represents a single filter rule
 */
export interface FilterRule {
    field: string;
    operator: FilterOperator;
    value: unknown;
}

/**
 * Represents a sort rule
 */
export interface SortRule {
    field: string;
    order: 'asc' | 'desc';
}

/**
 * Complete query options DTO
 */
export interface QueryOptionsDto {
    filters: FilterRule[];
    sort: SortRule[];
    page: number;
    limit: number;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
