import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Task } from '../tasks/task.entity';

export enum Role {
  ADMIN = 'admin',
  USER = 'user'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER
  })
  role: Role;

  @OneToMany(() => Task, task => task.assignedTo)
  tasks: Task[];
} 