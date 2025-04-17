import { Inject, forwardRef } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TasksService } from '../tasks/tasks.service';
import { EventLogsService } from '../event-logs/event-logs.service';
import { UsersService } from '../users/users.service';
import { User, Role } from '../users/user.entity';
import { Task } from '../tasks/task.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => TasksService))
    private tasksService: TasksService,
    @Inject(forwardRef(() => EventLogsService))
    private eventLogsService: EventLogsService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinUserRoom')
  handleJoinUserRoom(client: Socket, userId: string) {
    client.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  }

  @SubscribeMessage('leaveUserRoom')
  handleLeaveUserRoom(client: Socket, userId: string) {
    client.leave(`user-${userId}`);
    console.log(`User ${userId} left their room`);
  }

  @SubscribeMessage('joinTaskRoom')
  handleJoinTaskRoom(client: Socket, taskId: string) {
    client.join(`task-${taskId}`);
    console.log(`Client joined task room: ${taskId}`);
  }

  @SubscribeMessage('leaveTaskRoom')
  handleLeaveTaskRoom(client: Socket, taskId: string) {
    client.leave(`task-${taskId}`);
    console.log(`Client left task room: ${taskId}`);
  }

  @SubscribeMessage('joinAdminRoom')
  handleJoinAdminRoom(client: Socket) {
    client.join('admin-room');
    console.log(`Client joined admin room`);
  }

  @SubscribeMessage('leaveAdminRoom')
  handleLeaveAdminRoom(client: Socket) {
    client.leave('admin-room');
    console.log(`Client left admin room`);
  }

  async emitTaskAssigned(taskId: string, assignedTo: User) {
    const task = await this.tasksService.findOne(taskId);
    
    // Emit to the assigned user's room
    this.server.to(`user-${assignedTo.id}`).emit('taskAssigned', {
      taskId,
      task,
      message: `Task "${task.title}" has been assigned to you`,
    });
    
    // Emit to the task room
    this.server.to(`task-${taskId}`).emit('taskUpdated', {
      taskId,
      task,
      message: `Task "${task.title}" has been assigned to ${assignedTo.email}`,
    });
    
    // Emit to admin room
    this.server.to('admin-room').emit('taskAssigned', {
      taskId,
      task,
      message: `Task "${task.title}" has been assigned to ${assignedTo.email}`,
    });
    
    // Log the event
    await this.eventLogsService.create(
      'TASK_ASSIGNED',
      assignedTo.id,
      `Task ${taskId} assigned to user ${assignedTo.id}`,
    );
  }

  async emitTaskUpdated(taskId: string, updatedBy: User) {
    const task = await this.tasksService.findOne(taskId);
    
    // Create the update payload
    const updatePayload = {
      taskId,
      task,
      message: `Task "${task.title}" has been updated`,
      updatedBy: updatedBy.email,
    };

    // Broadcast to all clients interested in this specific task
    this.server.to(`task-${taskId}`).emit('taskUpdated', updatePayload);
    
    // If there's an assigned user, send them a notification
    if (task.assignedTo) {
      this.server.to(`user-${task.assignedTo.id}`).emit('taskUpdated', {
        ...updatePayload,
        message: `Task "${task.title}" assigned to you has been updated`,
      });
    }
    
    // Notify all admins
    this.server.to('admin-room').emit('taskUpdated', updatePayload);
    
    // Create a global broadcast for task status updates
    this.server.emit('taskStatusUpdated', {
      taskId: task.id,
      status: task.status,
      updatedAt: task.updatedAt,
    });
    
    // Log the event
    await this.eventLogsService.create(
      'TASK_UPDATED',
      updatedBy.id,
      `Task ${taskId} updated by user ${updatedBy.id}`,
    );
  }

  async emitTaskCreated(task: Task, createdBy: User) {
    // Create payload
    const createPayload = {
      task,
      message: `New task "${task.title}" has been created`,
      createdBy: createdBy.email,
    };
    
    // Emit to all connected clients
    this.server.emit('taskCreated', createPayload);
    
    // Specifically notify admins
    this.server.to('admin-room').emit('taskCreated', createPayload);
    
    // If assigned to someone, notify them
    if (task.assignedTo) {
      this.server.to(`user-${task.assignedTo.id}`).emit('taskAssigned', {
        taskId: task.id,
        task,
        message: `New task "${task.title}" has been assigned to you`,
      });
    }
    
    // Log the event
    await this.eventLogsService.create(
      'TASK_CREATED',
      createdBy.id,
      `Task ${task.id} created by user ${createdBy.id}`,
    );
  }
} 