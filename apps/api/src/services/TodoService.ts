import { TodoRepository } from '../repositories/TodoRepository';

export class TodoService {
  private todoRepository: TodoRepository;

  constructor() {
    this.todoRepository = new TodoRepository();
  }

  async create(userId: number, title: string) {
    return this.todoRepository.createTodo(userId, title);
  }

  async getAllForUser(userId: number) {
    return this.todoRepository.findTodosByUser(userId);
  }

  async update(todoId: number, userId: number, data: { title?: string; completed?: boolean }) {
    const existingTodo = await this.todoRepository.findTodoByIdAndUser(todoId, userId);
    if (!existingTodo) {
      throw new Error('Todo not found');
    }

    return this.todoRepository.updateTodo(todoId, data);
  }

  async delete(todoId: number, userId: number) {
    const existingTodo = await this.todoRepository.findTodoByIdAndUser(todoId, userId);
    if (!existingTodo) {
      throw new Error('Todo not found');
    }

    return this.todoRepository.deleteTodo(todoId);
  }
}
