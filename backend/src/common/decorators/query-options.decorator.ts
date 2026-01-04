// src/common/decorators/query-options.decorator.ts
// Custom parameter decorator to parse URL query parameters into QueryOptionsDto

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import {
    FilterOperator,
    FilterRule,
    QueryOptionsDto,
    SortRule,
} from '../interfaces/query.interface.js';

/**
 * Parse filter parameter: filter[field:operator]=value
 * Example: filter[name:like]=John&filter[age:gte]=25&filter[status:in]=active,pending
 */
function parseFilters(query: Record<string, unknown>): FilterRule[] {
    const filters: FilterRule[] = [];
    const filterPattern = /^filter\[([^:]+):([^\]]+)\]$/;

    for (const [key, value] of Object.entries(query)) {
        const match = key.match(filterPattern);
        if (match && value !== undefined && value !== '') {
            const [, field, operatorStr] = match;
            const operator = operatorStr as FilterOperator;

            // Validate operator
            if (!Object.values(FilterOperator).includes(operator)) {
                continue;
            }

            // Handle 'in' and 'nin' operators - split comma-separated values
            let parsedValue: unknown = value;
            if (operator === FilterOperator.IN || operator === FilterOperator.NIN) {
                parsedValue = String(value)
                    .split(',')
                    .map((v) => v.trim())
                    .filter((v) => v !== '');
            }

            filters.push({
                field,
                operator,
                value: parsedValue,
            });
        }
    }

    return filters;
}

/**
 * Parse sort parameter: sort=-field (descending) or sort=field (ascending)
 * Supports multiple fields: sort=-createdAt,name
 */
function parseSort(query: Record<string, unknown>): SortRule[] {
    const sortParam = query['sort'];
    if (!sortParam || typeof sortParam !== 'string') {
        return [];
    }

    return sortParam
        .split(',')
        .map((field) => field.trim())
        .filter((field) => field !== '')
        .map((field) => {
            if (field.startsWith('-')) {
                return {
                    field: field.substring(1),
                    order: 'desc' as const,
                };
            }
            return {
                field,
                order: 'asc' as const,
            };
        });
}

/**
 * Parse pagination parameters: page=1&limit=10
 */
function parsePagination(query: Record<string, unknown>): {
    page: number;
    limit: number;
} {
    const page = parseInt(String(query['page'] || '1'), 10);
    const limit = parseInt(String(query['limit'] || '10'), 10);

    return {
        page: isNaN(page) || page < 1 ? 1 : page,
        limit: isNaN(limit) || limit < 1 ? 10 : Math.min(limit, 100), // Max 100 items per page
    };
}

/**
 * @QueryOptions() decorator
 * Parses URL query parameters into QueryOptionsDto
 *
 * URL Syntax: GET /resource?filter[field:operator]=value&sort=-field&page=1&limit=10
 *
 * Examples:
 * - filter[name:like]=John
 * - filter[age:gte]=25
 * - filter[status:in]=active,pending
 * - sort=-createdAt,name
 * - page=1&limit=20
 */
export const QueryOptions = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): QueryOptionsDto => {
        const request = ctx.switchToHttp().getRequest<Request>();
        const query = request.query as Record<string, unknown>;

        const filters = parseFilters(query);
        const sort = parseSort(query);
        const { page, limit } = parsePagination(query);

        return {
            filters,
            sort,
            page,
            limit,
        };
    },
);
