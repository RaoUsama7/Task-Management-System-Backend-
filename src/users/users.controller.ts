import { Controller, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Patch('profile')
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.id, updateProfileDto);
    return { message: 'Profile updated successfully', user };
  }
}
