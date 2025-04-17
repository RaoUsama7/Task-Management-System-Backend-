import { Injectable, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UsersService } from '../users/users.service';
import { EventLogsService } from '../event-logs/event-logs.service';
import { EventsGateway } from '../events/events.gateway';
import { User, Role } from '../users/user.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private usersService: UsersService,
    private eventLogsService: EventLogsService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(createTaskDto: CreateTaskDto, currentUser: User): Promise<Task> {
    const task = this.tasksRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status || TaskStatus.PENDING,
    } as Task);
    
    // Assign user if provided in DTO
    if (createTaskDto.assignedToId) {
      const user = await this.usersService.findById(createTaskDto.assignedToId);
      if (user) {
        task.assignedTo = user;
        task.assignedToEmail = user.email;
      }
    }
    
    const savedTask = await this.tasksRepository.save(task);
    
    // Emit task created event
    await this.eventsGateway.emitTaskCreated(savedTask, currentUser);
    
    return savedTask;
  }

  async findAll(user: User, status?: string): Promise<Task[]> {
    this.logger.log(`Finding tasks for user: ${user.id} with role: ${user.role}`);
    
    // Build query
    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo');
    
    // Add status filter if provided
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      query.andWhere('task.status = :status', { status });
    }
    
    // Add user filter based on role
    if (user.role !== Role.ADMIN) {
      query.andWhere('assignedTo.id = :userId', { userId: user.id });
    }
    
    const tasks = await query.getMany();
    this.logger.log(`Found ${tasks.length} tasks`);
    return tasks;
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['assignedTo'],
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, currentUser: User): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, updateTaskDto);
    const updatedTask = await this.tasksRepository.save(task);
    
    // Emit task updated event
    await this.eventsGateway.emitTaskUpdated(id, currentUser);
    
    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.tasksRepository.remove(task);
  }

  async assignTask(taskId: string, userId: string, currentUser: User): Promise<Task> {
    const task = await this.findOne(taskId);
    const newAssignee = await this.usersService.findById(userId);
    
    if (!newAssignee) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    task.assignedTo = newAssignee;
    task.assignedToEmail = newAssignee.email;
    const updatedTask = await this.tasksRepository.save(task);

    // Emit task assigned event
    await this.eventsGateway.emitTaskAssigned(taskId, newAssignee);

    return updatedTask;
  }
} 