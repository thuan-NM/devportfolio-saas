// src/modules/employees/employees.repository.ts
// Employees repository extending BaseRepository

import { Injectable } from '@nestjs/common';
import type { Employee } from '../../generated/prisma/client.js';
import { Prisma } from '../../generated/prisma/client.js';
import { BaseRepository } from '../../common/repositories/base.repository.js';
import { PrismaService } from '../../core/prisma/prisma.service.js';

@Injectable()
export class EmployeesRepository extends BaseRepository<
  Employee,
  Prisma.EmployeeCreateInput,
  Prisma.EmployeeUpdateInput
> {
  protected readonly modelName = 'employee';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Find employee by employee ID (business key)
   */
  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    return this.model.findUnique({
      where: { employeeId },
    });
  }

  /**
   * Find employee by email
   */
  async findByEmail(email: string): Promise<Employee | null> {
    return this.model.findUnique({
      where: { email },
    });
  }

  /**
   * Find all active employees
   */
  async findActive(): Promise<Employee[]> {
    return this.model.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
