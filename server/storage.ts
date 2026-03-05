import { db } from "./db";
import {
  users, categories, tasks, timeLogs,
  type User, type InsertUser, type UpdateUserRequest,
  type Category, type InsertCategory, type UpdateCategoryRequest,
  type Task, type InsertTask, type UpdateTaskRequest,
  type TimeLog, type InsertTimeLog, type UpdateTimeLogRequest,
  type TimeLogWithRelations, type TaskWithCategory
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUserRequest): Promise<User>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: UpdateCategoryRequest): Promise<Category>;

  // Tasks
  getTasks(): Promise<TaskWithCategory[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;

  // Time Logs
  getTimeLogs(): Promise<TimeLogWithRelations[]>;
  createTimeLog(log: InsertTimeLog): Promise<TimeLog>;
  updateTimeLog(id: number, updates: UpdateTimeLogRequest): Promise<TimeLog>;
  deleteTimeLog(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: UpdateUserRequest): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  async updateCategory(id: number, updates: UpdateCategoryRequest): Promise<Category> {
    const [category] = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return category;
  }

  // Tasks
  async getTasks(): Promise<TaskWithCategory[]> {
    return await db.query.tasks.findMany({
      with: {
        category: true
      }
    }) as TaskWithCategory[];
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task;
  }

  // Time Logs
  async getTimeLogs(): Promise<TimeLogWithRelations[]> {
    const logs = await db.query.timeLogs.findMany({
      with: {
        user: true,
        task: {
          with: {
            category: true
          }
        },
      },
      orderBy: (timeLogs, { desc }) => [desc(timeLogs.date), desc(timeLogs.startTime)]
    }) as unknown as TimeLogWithRelations[];
    return logs;
  }

  async createTimeLog(insertLog: InsertTimeLog): Promise<TimeLog> {
    const [log] = await db.insert(timeLogs).values(insertLog).returning();
    return log;
  }

  async updateTimeLog(id: number, updates: UpdateTimeLogRequest): Promise<TimeLog> {
    const [log] = await db.update(timeLogs).set(updates).where(eq(timeLogs.id, id)).returning();
    return log;
  }

  async deleteTimeLog(id: number): Promise<void> {
    await db.delete(timeLogs).where(eq(timeLogs.id, id));
  }
}

export const storage = new DatabaseStorage();
