import { TodoSprint } from "@/components/apps/todo-sprint";
import { Auth } from "@/components/auth";

export default function Home() {
  return (
    <Auth>
      <section className="grid gap-6">
        <TodoSprint />
      </section>
    </Auth>
  );
}
