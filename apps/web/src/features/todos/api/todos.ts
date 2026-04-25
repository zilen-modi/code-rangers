import { apiClient } from '@/services/api-client';
import { apiUrls } from '@/services/api-urls';
import {
  CreateTodoPayload,
  DeleteTodoResponse,
  TodoResponse,
  TodosResponse,
  UpdateTodoPayload,
} from '@/features/todos/types';

export async function getTodos() {
  const response = await apiClient.get<TodosResponse>(apiUrls.todos);
  return response.data;
}

export async function createTodo(payload: CreateTodoPayload) {
  const response = await apiClient.post<TodoResponse>(apiUrls.todos, payload);
  return response.data;
}

export async function updateTodo(todoId: number, payload: UpdateTodoPayload) {
  const response = await apiClient.put<TodoResponse>(`${apiUrls.todos}/${todoId}`, payload);
  return response.data;
}

export async function deleteTodo(todoId: number) {
  const response = await apiClient.delete<DeleteTodoResponse>(`${apiUrls.todos}/${todoId}`);
  return response.data;
}
