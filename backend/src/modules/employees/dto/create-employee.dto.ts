// src/modules/employees/dto/create-employee.dto.ts
// DTO for creating an employee

import {
    IsBoolean,
    IsDateString,
    IsEmail,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
} from 'class-validator';

export class CreateEmployeeDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    employeeId!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    firstName!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    lastName!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    department!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    position!: string;

    @IsNumber()
    @IsPositive()
    salary!: number;

    @IsDateString()
    @IsNotEmpty()
    hireDate!: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
