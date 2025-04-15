import { Inject, forwardRef } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TasksService } from '../tasks/tasks.service';
import { EventLogsService } from '../event-logs/event-logs.service';
import { User } from '../users/user.entity';
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

  async emitTaskAssigned(taskId: string, assignedTo: User) {
    const task = await this.tasksService.findOne(taskId);
    // Emit to the assigned user's room
    this.server.to(`user-${assignedTo.id}`).emit('taskAssigned', {
      taskId,
      task,
      message: `Task "${task.title}" has been assigned to you`,
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
    if (task.assignedTo) {
      // Emit to the assigned user's room
      this.server.to(`user-${task.assignedTo.id}`).emit('taskUpdated', {
        taskId,
        task,
        message: `Task "${task.title}" has been updated`,
        updatedBy: updatedBy.email,
      });
      // Log the event
      await this.eventLogsService.create(
        'TASK_UPDATED',
        updatedBy.id,
        `Task ${taskId} updated by user ${updatedBy.id}`,
      );
    }
  }

  async emitTaskCreated(task: Task, createdBy: User) {
    // Emit to all connected clients
    this.server.emit('taskCreated', {
      task,
      message: `New task "${task.title}" has been created`,
      createdBy: createdBy.email,
    });
    // Log the event
    await this.eventLogsService.create(
      'TASK_CREATED',
      createdBy.id,
      `Task ${task.id} created by user ${createdBy.id}`,
    );
  }
} 