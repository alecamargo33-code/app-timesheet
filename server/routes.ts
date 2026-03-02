import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Users
  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  app.post(api.users.create.path, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.users.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.users.update.input.parse(req.body);
      const user = await storage.updateUser(id, input);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      res.json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Tasks
  app.get(api.tasks.list.path, async (req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.tasks.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(id, input);
      if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Time Logs
  app.get(api.timeLogs.list.path, async (req, res) => {
    const logs = await storage.getTimeLogs();
    res.json(logs);
  });

  app.post(api.timeLogs.create.path, async (req, res) => {
    try {
      const input = api.timeLogs.create.input.parse(req.body);
      const log = await storage.createTimeLog(input);
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.timeLogs.update.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.timeLogs.update.input.parse(req.body);
      const log = await storage.updateTimeLog(id, input);
      if (!log) {
        return res.status(404).json({ message: "Lançamento não encontrado" });
      }
      res.json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.timeLogs.delete.path, async (req, res) => {
    const id = parseInt(req.params.id);
    await storage.deleteTimeLog(id);
    res.status(204).send();
  });

  // Seed data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const users = await storage.getUsers();
  if (users.length === 0) {
    const u1 = await storage.createUser({ name: "Carlos Silva", role: "Desenvolvedor Backend", isActive: true });
    const u2 = await storage.createUser({ name: "Ana Souza", role: "Product Manager", isActive: true });
    
    const t1 = await storage.createTask({ name: "Daily Scrum", category: "Reunião", description: "Alinhamento diário da equipe", isActive: true });
    const t2 = await storage.createTask({ name: "Implementar API de Pagamento", category: "Projeto", description: "Integração com Stripe", isActive: true });
    const t3 = await storage.createTask({ name: "Estudar Next.js", category: "Estudo", description: "Curso da Alura", isActive: true });
    
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    await storage.createTimeLog({
      userId: u1.id,
      taskId: t1.id,
      date: dateStr,
      startTime: "09:00",
      endTime: "09:30",
      durationMinutes: 30
    });
    
    await storage.createTimeLog({
      userId: u1.id,
      taskId: t2.id,
      date: dateStr,
      startTime: "10:00",
      endTime: "12:00",
      durationMinutes: 120
    });
    
    await storage.createTimeLog({
      userId: u2.id,
      taskId: t1.id,
      date: dateStr,
      startTime: "09:00",
      endTime: "09:30",
      durationMinutes: 30
    });
  }
}
