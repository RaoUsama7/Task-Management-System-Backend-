import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventLogDocument = EventLog & Document;

@Schema({ timestamps: true })
export class EventLog {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  user: string;

  @Prop({ required: true })
  task: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog); 