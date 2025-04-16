import { Role } from '../user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  role: Role;
}

export class PaginatedUserResponseDto {
  users: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
} 