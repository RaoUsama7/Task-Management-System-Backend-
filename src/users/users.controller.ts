import { Controller, Patch, Body, UseGuards, Req, Get, Query, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from './user.entity';
import { PaginatedUserResponseDto, UserResponseDto } from './dto/user-response.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll(
    @Req() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<PaginatedUserResponseDto> {
    // Check if the requesting user is an admin
    if (req.user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only administrators can access all users');
    }
    
    // Convert string query params to numbers
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    
    return this.usersService.findAll(pageNumber, limitNumber);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req, 
    @Body() updateProfileDto: UpdateProfileDto
  ): Promise<{ message: string; user: UserResponseDto }> {
    const user = await this.usersService.updateProfile(req.user.id, updateProfileDto);
    
    // Convert to DTO to exclude sensitive data
    const userResponse: UserResponseDto = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    return { message: 'Profile updated successfully', user: userResponse };
  }
}
