import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventLog } from './schemas/event-log.schema';

@Injectable()
export class EventLogsService {
  constructor(
    @InjectModel(EventLog.name) private eventLogModel: Model<EventLog>,
  ) {}

  async create(action: string, userId: string, details: string): Promise<EventLog> {
    const eventLog = new this.eventLogModel({
      action,
      userId,
      details,
      timestamp: new Date(),
    });
    return eventLog.save();
  }

  async findAll(): Promise<EventLog[]> {
    return this.eventLogModel.find().exec();
  }

  async findByUserId(userId: string): Promise<EventLog[]> {
    return this.eventLogModel.find({ userId }).exec();
  }
} 