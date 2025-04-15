import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventLogDocument = EventLog & Document;

@Schema()
export class EventLog {
  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  details: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog); 