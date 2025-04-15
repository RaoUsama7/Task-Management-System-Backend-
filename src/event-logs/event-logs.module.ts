import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLogsService } from './event-logs.service';
import { EventLog, EventLogSchema } from './schemas/event-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: EventLog.name, schema: EventLogSchema }]),
  ],
  providers: [EventLogsService],
  exports: [EventLogsService],
})
export class EventLogsModule {} 