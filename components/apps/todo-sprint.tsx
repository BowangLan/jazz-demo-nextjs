"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "jazz-tools/react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { JazzAccount, TodoListSchema, type TodoItem } from "@/lib/jazz";

export function TodoSprint() {
  const [newTodo, setNewTodo] = useState("");
  const account = useAccount(JazzAccount, {
    resolve: {
      root: {
        todos: { $each: true },
      },
    },
  });

  const todos = account.$isLoaded ? account.root.todos : null;

  useEffect(() => {
    if (!account.$isLoaded) {
      return;
    }

    if (account.root?.$isLoaded && !account.root.$jazz.has("todos")) {
      account.root.$jazz.set(
        "todos",
        TodoListSchema.create([], { owner: account.root.$jazz.owner })
      );
    }
  }, [account]);

  const todoProgress = useMemo(() => {
    if (!todos || todos.length === 0) {
      return 0;
    }
    const doneCount = todos.filter((todo) => todo.done).length;
    return Math.round((doneCount / todos.length) * 100);
  }, [todos]);

  const handleAddTodo = () => {
    const trimmed = newTodo.trim();
    if (!trimmed || !todos) {
      return;
    }

    todos.$jazz.push({ text: trimmed, done: false });
    setNewTodo("");
  };

  const handleGenerateTodo = () => {
    if (!todos) {
      return;
    }

    const ideas = [
      "Review sprint goals",
      "Plan tomorrow's top 3",
      "Tidy the inbox",
      "Ship one small fix",
      "Take a 10-minute walk",
    ];

    const idea = ideas[Math.floor(Math.random() * ideas.length)];
    todos.$jazz.push({ text: idea, done: false });
  };

  const handleToggleTodo = (todo: TodoItem, done: boolean) => {
    todo.$jazz.set("done", done);
  };

  const handleDeleteTodo = (index: number) => {
    if (!todos) {
      return;
    }
    todos.$jazz.splice(index, 1);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Todo sprint</CardTitle>
        <CardDescription>
          Keep the short list crisp and focused.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a quick task"
            value={newTodo}
            onChange={(event) => setNewTodo(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleAddTodo();
              }
            }}
          />
          <Button onClick={handleAddTodo}>Add</Button>
          <Button variant="outline" onClick={handleGenerateTodo}>
            Generate
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          {!account.$isLoaded ? (
            <p className="text-sm text-zinc-500">Loading tasks...</p>
          ) : !todos || todos.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No tasks yet — add your first one.
            </p>
          ) : (
            todos.map((todo, index) => (
              <div
                key={todo.$jazz.id}
                className="flex items-center justify-between gap-3 text-sm cursor-pointer group"
                onClick={() => handleToggleTodo(todo, !todo.done)}
              >
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={todo.done}
                    onCheckedChange={(checked) =>
                      handleToggleTodo(todo, checked === true)
                    }
                  />
                  <span
                    className={
                      "" +
                      (todo.done
                        ? "text-zinc-400 line-through"
                        : "text-zinc-800 dark:text-zinc-100")
                    }
                  >
                    {todo.text}
                  </span>
                </label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteTodo(index)}
                >
                  Remove
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{todoProgress}% complete</span>
            <span>{todos?.filter((todo) => todo.done).length ?? 0} done</span>
          </div>
          <Progress value={todoProgress} />
        </div>
      </CardContent>
    </Card>
  );
}
