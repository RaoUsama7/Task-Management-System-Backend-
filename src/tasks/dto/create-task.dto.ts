import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  status?: string;
  
  @IsUUID()
  @IsOptional()
  assignedToId?: string;
} 