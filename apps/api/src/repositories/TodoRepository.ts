import { prisma } from '../db';

export class TodoRepository {
  async createTodo(userId: number, title: string) {
    return prisma.todo.create({
      data: {
        title,
        userId,
      },
    });
  }

  async findTodosByUser(userId: number) {
    return prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTodoByIdAndUser(todoId: number, userId: number) {
    return prisma.todo.findFirst({
      where: { id: todoId, userId },
    });
  }

  async updateTodo(todoId: number, data: { title?: string; completed?: boolean }) {
    return prisma.todo.update({
      where: { id: todoId },
      data,
    });
  }

  async deleteTodo(todoId: number) {
    return prisma.todo.delete({
      where: { id: todoId },
    });
  }
}
