export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export type TodosResponse = {
  todos: Todo[];
};

export type TodoResponse = {
  message: string;
  todo: Todo;
};

export type DeleteTodoResponse = {
  message: string;
};

export type CreateTodoPayload = {
  title: string;
};

export type UpdateTodoPayload = {
  title?: string;
  completed?: boolean;
};
