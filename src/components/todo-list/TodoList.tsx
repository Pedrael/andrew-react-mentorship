import { useState } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: 'Todo 1', completed: false },
    { id: 2, text: 'Todo 2', completed: false },
    { id: 3, text: 'Todo 3', completed: false },
  ]);
  const [newTodo, setNewTodo] = useState<Todo | null>(null);

  function handleAddTodo(todo: Todo) {
    setTodos([...todos, todo]);
  }

  function handleToggleTodo(id: number) {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  return (
    <>
      
      <input
        type="text"
        onChange={(e) =>
          setNewTodo({ id: todos.length + 1, text: e.target.value, completed: false })
        }
      />
      <button
        onClick={() => {
          if (!newTodo) return;
          handleAddTodo({ id: todos.length + 1, text: newTodo.text, completed: false });
        }}
      >
        Add
      </button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggleTodo(todo.id)}
            />
            {todo.text}
          </li>
        ))}
      </ul>
    </>
  );
}
