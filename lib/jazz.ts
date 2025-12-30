import { Group, co, type InstanceOfSchema, z } from "jazz-tools";

export const TodoItemSchema = co.map({
  text: z.string(),
  done: z.boolean(),
});

export const TodoListSchema = co.list(TodoItemSchema);

export const TodoRootSchema = co.map({
  todos: TodoListSchema,
});

export const JazzAccount = co
  .account({
    profile: co.profile(),
    root: TodoRootSchema,
  })
  .withMigration((account) => {
    if (!account.$jazz.has("root")) {
      const owner = Group.create({ owner: account });
      account.$jazz.set(
        "root",
        TodoRootSchema.create(
          {
            todos: TodoListSchema.create([], { owner }),
          },
          { owner },
        ),
      );
      return;
    }

    if (account.root?.$isLoaded && !account.root.$jazz.has("todos")) {
      account.root.$jazz.set(
        "todos",
        TodoListSchema.create([], { owner: account.root.$jazz.owner }),
      );
    }
  });

export type TodoItem = InstanceOfSchema<typeof TodoItemSchema>;
