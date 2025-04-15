import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
} 