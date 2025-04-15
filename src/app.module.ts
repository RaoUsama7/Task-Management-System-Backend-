import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { EventLogsModule } from './event-logs/event-logs.module';
import { EventsModule } from './events/events.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST as string,
      port: +(process.env.DB_PORT as string),
      username: process.env.DB_USERNAME as string,
      password: process.env.DB_PASSWORD as string,
      database: process.env.DB_NAME as string,
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false, // only for dev/testing, not production
      },
    }),
    MongooseModule.forRoot(process.env.MONGO_URI as string),
    AuthModule,
    UsersModule,
    TasksModule,
    EventLogsModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
