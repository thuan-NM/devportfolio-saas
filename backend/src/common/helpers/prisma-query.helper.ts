// src/common/helpers/prisma-query.helper.ts
// Static helper class to convert QueryOptionsDto into Prisma where and orderBy objects

import {
    FilterOperator,
    OPERATOR_MAP,
} from '../interfaces/query.interface.js';
import type { FilterRule, SortRule } from '../interfaces/query.interface.js';

/**
 * PrismaQueryHelper - Converts QueryOptionsDto to Prisma query objects
 * Implements automatic type casting for Prisma strict typing
 */
export class PrismaQueryHelper {
    /**
     * Auto-cast string values to appropriate types
     * Prisma is strict about types, so we need to detect and convert:
     * - Boolean: "true"/"false" -> boolean
     * - Number: numeric strings -> number
     * - Otherwise: keep as string
     */
    private static castValue(value: string): string | number | boolean {
        // Handle boolean
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true') return true;
        if (lowerValue === 'false') return false;

        // Handle number
        const numValue = Number(value);
        if (!isNaN(numValue) && value.trim() !== '') {
            return numValue;
        }

        // Keep as string
        return value;
    }

    /**
     * Cast an array of values (for 'in' and 'nin' operators)
     */
    private static castArrayValues(
        values: unknown[],
    ): (string | number | boolean)[] {
        return values.map((v) => {
            if (typeof v === 'string') {
                return this.castValue(v);
            }
            return v as string | number | boolean;
        });
    }

    /**
     * Convert FilterRule[] to Prisma where object
     */
    static buildWhere(filters: FilterRule[]): Record<string, unknown> {
        const where: Record<string, unknown> = {};

        for (const filter of filters) {
            const prismaOperator = OPERATOR_MAP[filter.operator];
            if (!prismaOperator) continue;

            switch (filter.operator) {
                case FilterOperator.IN:
                case FilterOperator.NIN:
                    // Value should already be an array from the decorator
                    if (Array.isArray(filter.value)) {
                        where[filter.field] = {
                            [prismaOperator]: this.castArrayValues(filter.value),
                        };
                    }
                    break;

                case FilterOperator.LIKE:
                    // Use contains with insensitive mode
                    where[filter.field] = {
                        contains:
                            typeof filter.value === 'string'
                                ? filter.value
                                : String(filter.value),
                        mode: 'insensitive',
                    };
                    break;

                case FilterOperator.EQ:
                    // equals uses direct value
                    where[filter.field] =
                        typeof filter.value === 'string'
                            ? this.castValue(filter.value)
                            : filter.value;
                    break;

                case FilterOperator.NE:
                    // 'not' operator wraps the value
                    where[filter.field] = {
                        not:
                            typeof filter.value === 'string'
                                ? this.castValue(filter.value)
                                : filter.value,
                    };
                    break;

                case FilterOperator.GT:
                case FilterOperator.GTE:
                case FilterOperator.LT:
                case FilterOperator.LTE:
                    // Use the mapped operator directly
                    where[filter.field] = {
                        [prismaOperator]:
                            typeof filter.value === 'string'
                                ? this.castValue(filter.value)
                                : filter.value,
                    };
                    break;
            }
        }

        return where;
    }

    /**
     * Convert SortRule[] to Prisma orderBy array
     */
    static buildOrderBy(sort: SortRule[]): Record<string, 'asc' | 'desc'>[] {
        return sort.map((rule) => ({
            [rule.field]: rule.order,
        }));
    }

    /**
     * Calculate skip value for pagination
     */
    static calculateSkip(page: number, limit: number): number {
        return (page - 1) * limit;
    }
}
