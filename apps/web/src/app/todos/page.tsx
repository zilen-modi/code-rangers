'use client';

import { useState } from 'react';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTodosQuery } from '@/features/todos/hooks/use-todos-query';
import {
  useCreateTodoMutation,
  useDeleteTodoMutation,
  useUpdateTodoMutation,
} from '@/features/todos/hooks/use-todo-mutations';
import { getErrorMessage } from '@/services/error-handler';
import { Todo } from '@/features/todos/types';

export default function TodosPage() {
  const [newTodo, setNewTodo] = useState('');
  const router = useRouter();

  const { data, isLoading } = useTodosQuery();
  const createTodoMutation = useCreateTodoMutation();
  const updateTodoMutation = useUpdateTodoMutation();
  const deleteTodoMutation = useDeleteTodoMutation();

  const todos = data?.todos ?? [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim().length === 0) return;

    try {
      await createTodoMutation.mutateAsync({ title: newTodo.trim() });
      setNewTodo('');
      toast.success('Todo created');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleToggle = async (t: Todo) => {
    try {
      await updateTodoMutation.mutateAsync({ todoId: t.id, completed: t.completed === false });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTodoMutation.mutateAsync(id);
      toast.success('Todo deleted');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleLogout = () => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem('token');
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Your Todos
          </h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        <form onSubmit={handleCreate} className="flex gap-2">
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
          />
          <Button type="submit" disabled={createTodoMutation.isPending}>
            Add
          </Button>
        </form>

        <div className="space-y-3 mt-8">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-6">Loading todos...</p>
          ) : null}
          {isLoading ? null :
            todos.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-4 border rounded-xl shadow-sm hover:shadow-premium transition-shadow"
              >
                <div className="flex gap-3 items-center">
                  <input
                    type="checkbox"
                    checked={t.completed}
                    onChange={() => handleToggle(t)}
                    className="h-5 w-5 cursor-pointer"
                  />
                  <span
                    className={t.completed ? 'line-through text-muted-foreground' : 'text-foreground'}
                  >
                    {t.title}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDelete(t.id)}>
                  Delete
                </Button>
              </div>
            ))}
          {isLoading || todos.length > 0 ? null : (
            <p className="text-muted-foreground text-center py-6">
              No todos created yet! Why not add one?
            </p>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
