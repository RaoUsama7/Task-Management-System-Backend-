import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { TasksModule } from '../tasks/tasks.module';
import { EventLogsModule } from '../event-logs/event-logs.module';

@Module({
  imports: [
    forwardRef(() => TasksModule),
    EventLogsModule,
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {} 