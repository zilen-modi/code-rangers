'use client';
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const router = useRouter();

  const fetchTodos = async () => {
    try {
      const response = await apiClient.get('/todos');
      setTodos(response.data.todos);
    } catch {
      toast.error('Failed to load todos');
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      await apiClient.post('/todos', { title: newTodo });
      setNewTodo('');
      fetchTodos();
      toast.success('Todo created');
    } catch {
      toast.error('Failed to create todo');
    }
  };

  const handleToggle = async (t: Todo) => {
    try {
      await apiClient.put(`/todos/${t.id}`, { completed: !t.completed });
      fetchTodos();
    } catch {
      toast.error('Failed to update todo');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/todos/${id}`);
      fetchTodos();
      toast.success('Todo deleted');
    } catch {
      toast.error('Failed to delete todo');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
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
          <Button type="submit">Add</Button>
        </form>

        <div className="space-y-3 mt-8">
          {todos.map((t) => (
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
          {todos.length === 0 && (
            <p className="text-muted-foreground text-center py-6">
              No todos created yet! Why not add one?
            </p>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
