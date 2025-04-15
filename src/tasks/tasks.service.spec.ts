import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './task.entity';
import { UsersService } from '../users/users.service';
import { EventLogsService } from '../event-logs/event-logs.service';
import { EventsGateway } from '../events/events.gateway';
import { Repository } from 'typeorm';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepository: Repository<Task>;
  let usersService: UsersService;
  let eventLogsService: EventLogsService;
  let eventsGateway: EventsGateway;

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUsersService = {
    findById: jest.fn(),
  };

  const mockEventLogsService = {
    create: jest.fn(),
  };

  const mockEventsGateway = {
    emitTaskAssigned: jest.fn(),
    emitTaskUpdated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: EventLogsService,
          useValue: mockEventLogsService,
        },
        {
          provide: EventsGateway,
          useValue: mockEventsGateway,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    usersService = module.get<UsersService>(UsersService);
    eventLogsService = module.get<EventLogsService>(EventLogsService);
    eventsGateway = module.get<EventsGateway>(EventsGateway);
  });

  describe('create', () => {
    it('should create and return a task', async () => {
      const createTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
      };

      const mockTask = {
        id: 1,
        ...createTaskDto,
        assignedTo: mockUser,
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, mockUser.id);

      expect(mockTaskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        assignedTo: mockUser,
      });
      expect(mockTaskRepository.save).toHaveBeenCalledWith(mockTask);
      expect(result).toEqual(mockTask);
    });
  });

  describe('update', () => {
    it('should update task fields if authorized', async () => {
      const updateTaskDto = {
        title: 'Updated Task',
        description: 'Updated Description',
      };

      const mockUser = {
        id: 1,
        email: 'test@example.com',
      };

      const mockTask = {
        id: 1,
        title: 'Original Task',
        description: 'Original Description',
        assignedTo: mockUser,
      };

      const updatedTask = {
        ...mockTask,
        ...updateTaskDto,
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.update.mockResolvedValue(undefined);
      mockTaskRepository.findOne.mockResolvedValueOnce(updatedTask);

      const result = await service.update(1, updateTaskDto, mockUser.id);

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['assignedTo'],
      });
      expect(mockTaskRepository.update).toHaveBeenCalledWith(1, updateTaskDto);
      expect(mockEventLogsService.create).toHaveBeenCalled();
      expect(mockEventsGateway.emitTaskUpdated).toHaveBeenCalledWith(1);
      expect(result).toEqual(updatedTask);
    });
  });

  describe('assignTask', () => {
    it('should assign task to user (only admin)', async () => {
      const assignTaskDto = {
        userId: 2,
      };

      const mockAdmin = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
      };

      const mockAssignee = {
        id: 2,
        email: 'user@example.com',
      };

      const mockTask = {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        assignedTo: mockAdmin,
      };

      const assignedTask = {
        ...mockTask,
        assignedTo: mockAssignee,
      };

      mockUsersService.findById
        .mockResolvedValueOnce(mockAdmin)
        .mockResolvedValueOnce(mockAssignee);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(assignedTask);
      mockTaskRepository.findOne.mockResolvedValueOnce(assignedTask);

      const result = await service.assignTask(1, assignTaskDto.userId, mockAdmin.id);

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['assignedTo'],
      });
      expect(mockTaskRepository.save).toHaveBeenCalledWith({
        ...mockTask,
        assignedTo: mockAssignee,
      });
      expect(mockEventLogsService.create).toHaveBeenCalled();
      expect(mockEventsGateway.emitTaskAssigned).toHaveBeenCalledWith(1, assignTaskDto.userId);
      expect(result).toEqual(assignedTask);
    });
  });

  describe('remove', () => {
    it('should delete task by ID', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
      };

      const mockTask = {
        id: 1,
        title: 'Test Task',
        assignedTo: mockUser,
      };

      mockUsersService.findById.mockResolvedValue(mockUser);
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockTaskRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(1, mockUser.id);

      expect(mockTaskRepository.delete).toHaveBeenCalledWith(1);
      expect(mockEventLogsService.create).toHaveBeenCalled();
    });
  });
}); 