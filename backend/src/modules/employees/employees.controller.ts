// src/modules/employees/employees.controller.ts
// Employees controller with REST endpoints

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import type { Employee } from '../../generated/prisma/client.js';
import { QueryOptions } from '../../common/decorators/query-options.decorator.js';
import type {
    PaginatedResult,
    QueryOptionsDto,
} from '../../common/interfaces/query.interface.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeesService } from './employees.service.js';

@Controller('employees')
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    /**
     * GET /employees
     * Get all employees with pagination, filtering, and sorting
     *
     * Query examples:
     * - /employees?filter[department:eq]=Engineering&sort=-salary&page=1&limit=10
     * - /employees?filter[isActive:eq]=true&filter[salary:gte]=50000
     * - /employees?filter[firstName:like]=John&sort=lastName
     * - /employees?filter[department:in]=Engineering,HR,Sales
     */
    @Get()
    async findAll(
        @QueryOptions() options: QueryOptionsDto,
    ): Promise<PaginatedResult<Employee>> {
        return this.employeesService.findAll(options);
    }

    /**
     * GET /employees/:id
     * Get a single employee by ID
     */
    @Get(':id')
    async findById(@Param('id') id: string): Promise<Employee> {
        return this.employeesService.findById(id);
    }

    /**
     * POST /employees
     * Create a new employee
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() dto: CreateEmployeeDto): Promise<Employee> {
        return this.employeesService.create(dto);
    }

    /**
     * PUT /employees/:id
     * Update an existing employee
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() dto: UpdateEmployeeDto,
    ): Promise<Employee> {
        return this.employeesService.update(id, dto);
    }

    /**
     * DELETE /employees/:id
     * Delete an employee
     */
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param('id') id: string): Promise<void> {
        await this.employeesService.delete(id);
    }
}
