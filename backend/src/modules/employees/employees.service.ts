// src/modules/employees/employees.service.ts
// Employees service handling business logic

import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import type { Employee } from '../../generated/prisma/client.js';
import { Prisma } from '../../generated/prisma/client.js';
import type {
    PaginatedResult,
    QueryOptionsDto,
} from '../../common/interfaces/query.interface.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { EmployeesRepository } from './employees.repository.js';

@Injectable()
export class EmployeesService {
    constructor(private readonly employeesRepository: EmployeesRepository) { }

    /**
     * Get all employees with pagination, filtering, and sorting
     */
    async findAll(options?: QueryOptionsDto): Promise<PaginatedResult<Employee>> {
        return this.employeesRepository.findMany(options);
    }

    /**
     * Get a single employee by ID
     */
    async findById(id: string): Promise<Employee> {
        const employee = await this.employeesRepository.findById(id);
        if (!employee) {
            throw new NotFoundException(`Employee with ID "${id}" not found`);
        }
        return employee;
    }

    /**
     * Get a single employee by employee ID (business key)
     */
    async findByEmployeeId(employeeId: string): Promise<Employee> {
        const employee =
            await this.employeesRepository.findByEmployeeId(employeeId);
        if (!employee) {
            throw new NotFoundException(
                `Employee with employee ID "${employeeId}" not found`,
            );
        }
        return employee;
    }

    /**
     * Create a new employee
     */
    async create(dto: CreateEmployeeDto): Promise<Employee> {
        // Check for duplicate employee ID
        const existingByEmployeeId =
            await this.employeesRepository.findByEmployeeId(dto.employeeId);
        if (existingByEmployeeId) {
            throw new ConflictException(
                `Employee with employee ID "${dto.employeeId}" already exists`,
            );
        }

        // Check for duplicate email
        const existingByEmail = await this.employeesRepository.findByEmail(
            dto.email,
        );
        if (existingByEmail) {
            throw new ConflictException(
                `Employee with email "${dto.email}" already exists`,
            );
        }

        const data: Prisma.EmployeeCreateInput = {
            employeeId: dto.employeeId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            email: dto.email,
            department: dto.department,
            position: dto.position,
            salary: dto.salary,
            hireDate: new Date(dto.hireDate),
            isActive: dto.isActive ?? true,
        };

        return this.employeesRepository.create(data);
    }

    /**
     * Update an existing employee
     */
    async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
        // Verify employee exists
        await this.findById(id);

        // Check for duplicate email if updating
        if (dto.email) {
            const existingByEmail = await this.employeesRepository.findByEmail(
                dto.email,
            );
            if (existingByEmail && existingByEmail.id !== id) {
                throw new ConflictException(
                    `Employee with email "${dto.email}" already exists`,
                );
            }
        }

        const data: Prisma.EmployeeUpdateInput = {};

        if (dto.firstName !== undefined) data.firstName = dto.firstName;
        if (dto.lastName !== undefined) data.lastName = dto.lastName;
        if (dto.email !== undefined) data.email = dto.email;
        if (dto.department !== undefined) data.department = dto.department;
        if (dto.position !== undefined) data.position = dto.position;
        if (dto.salary !== undefined) data.salary = dto.salary;
        if (dto.hireDate !== undefined) data.hireDate = new Date(dto.hireDate);
        if (dto.isActive !== undefined) data.isActive = dto.isActive;

        return this.employeesRepository.update(id, data);
    }

    /**
     * Delete an employee
     */
    async delete(id: string): Promise<Employee> {
        // Verify employee exists
        await this.findById(id);
        return this.employeesRepository.delete(id);
    }
}
