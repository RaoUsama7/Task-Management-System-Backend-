import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from './user.entity';
import * as bcrypt from 'bcrypt';
import { PaginatedUserResponseDto, UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedUserResponseDto> {
    const [users, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      select: ['id', 'email', 'role'], // Exclude password from results
    });
    
    // Map users to UserResponseDto
    const userResponses: UserResponseDto[] = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role
    }));
    
    return {
      users: userResponses,
      total,
      page,
      limit,
    };
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return user || undefined;
  }

  async findById(id: string): Promise<User> {
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      throw new NotFoundException('Invalid user ID format');
    }
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }

  async updateProfile(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, data);
    return this.usersRepository.save(user);
  }

  async findAllAdmins(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: Role.ADMIN },
    });
  }
}
