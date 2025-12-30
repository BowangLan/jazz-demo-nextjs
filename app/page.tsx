import { TodoSprint } from "@/components/apps/todo-sprint";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            Jazz Demo
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Jazz-powered todo sprint.
          </h1>
          <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
            A single shared todo list that syncs instantly between sessions.
          </p>
        </section>

        <section className="grid gap-6">
          <TodoSprint />
        </section>
      </main>
    </div>
  );
}
