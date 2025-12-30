// Database interface for real-time sync engine testing
// This can be easily swapped out with any database/sync implementation

export interface DatabaseItem {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoItem extends DatabaseItem {
  text: string;
  done: boolean;
  doneAt?: Date;
}

export interface FocusSession extends DatabaseItem {
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  completed: boolean;
}

export interface HabitCompletion extends DatabaseItem {
  habitId: string;
  habitLabel: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
}

export interface Habit extends DatabaseItem {
  label: string;
  enabled: boolean;
}

export interface Database {
  // Todos
  getTodos(): Promise<TodoItem[]>;
  createTodo(text: string): Promise<TodoItem>;
  updateTodo(id: string, updates: Partial<Pick<TodoItem, 'text' | 'done'>>): Promise<TodoItem>;
  deleteTodo(id: string): Promise<void>;

  // Focus Sessions
  getFocusSessions(): Promise<FocusSession[]>;
  startFocusSession(): Promise<FocusSession>;
  completeFocusSession(id: string, duration: number): Promise<FocusSession>;
  getCurrentFocusSession(): Promise<FocusSession | null>;

  // Habits
  getHabits(): Promise<Habit[]>;
  createHabit(label: string): Promise<Habit>;
  updateHabit(id: string, updates: Partial<Pick<Habit, 'label' | 'enabled'>>): Promise<Habit>;
  deleteHabit(id: string): Promise<void>;

  // Habit Completions
  getHabitCompletions(date?: string): Promise<HabitCompletion[]>;
  toggleHabitCompletion(habitId: string, habitLabel: string, date: string, completed: boolean): Promise<HabitCompletion>;
}

// Local Storage Implementation
export class LocalStorageDatabase implements Database {
  private readonly TODOS_KEY = 'jazz-demo-todos';
  private readonly SESSIONS_KEY = 'jazz-demo-sessions';
  private readonly HABITS_KEY = 'jazz-demo-habits';
  private readonly COMPLETIONS_KEY = 'jazz-demo-completions';

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getFromStorage<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data).map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        ...(item.doneAt && { doneAt: new Date(item.doneAt) }),
        ...(item.startTime && { startTime: new Date(item.startTime) }),
        ...(item.endTime && { endTime: new Date(item.endTime) }),
        ...(item.date && { date: item.date }),
      })) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage<T>(key: string, items: T[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(items));
  }

  // Todos
  async getTodos(): Promise<TodoItem[]> {
    return this.getFromStorage<TodoItem>(this.TODOS_KEY);
  }

  async createTodo(text: string): Promise<TodoItem> {
    const todos = await this.getTodos();
    const now = new Date();
    const todo: TodoItem = {
      id: this.generateId(),
      text,
      done: false,
      createdAt: now,
      updatedAt: now,
    };
    todos.push(todo);
    this.saveToStorage(this.TODOS_KEY, todos);
    return todo;
  }

  async updateTodo(id: string, updates: Partial<Pick<TodoItem, 'text' | 'done'>>): Promise<TodoItem> {
    const todos = await this.getTodos();
    const todoIndex = todos.findIndex(t => t.id === id);
    if (todoIndex === -1) throw new Error('Todo not found');

    const todo = todos[todoIndex];
    const updatedTodo = {
      ...todo,
      ...updates,
      updatedAt: new Date(),
      ...(updates.done !== undefined && updates.done && !todo.done && { doneAt: new Date() }),
    };
    todos[todoIndex] = updatedTodo;
    this.saveToStorage(this.TODOS_KEY, todos);
    return updatedTodo;
  }

  async deleteTodo(id: string): Promise<void> {
    const todos = await this.getTodos();
    const filteredTodos = todos.filter(t => t.id !== id);
    this.saveToStorage(this.TODOS_KEY, filteredTodos);
  }

  // Focus Sessions
  async getFocusSessions(): Promise<FocusSession[]> {
    return this.getFromStorage<FocusSession>(this.SESSIONS_KEY);
  }

  async startFocusSession(): Promise<FocusSession> {
    const sessions = await this.getFocusSessions();
    const now = new Date();
    const session: FocusSession = {
      id: this.generateId(),
      startTime: now,
      duration: 25 * 60, // 25 minutes in seconds
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    sessions.push(session);
    this.saveToStorage(this.SESSIONS_KEY, sessions);
    return session;
  }

  async completeFocusSession(id: string, actualDuration: number): Promise<FocusSession> {
    const sessions = await this.getFocusSessions();
    const sessionIndex = sessions.findIndex(s => s.id === id);
    if (sessionIndex === -1) throw new Error('Session not found');

    const session = sessions[sessionIndex];
    const updatedSession = {
      ...session,
      endTime: new Date(),
      duration: actualDuration,
      completed: true,
      updatedAt: new Date(),
    };
    sessions[sessionIndex] = updatedSession;
    this.saveToStorage(this.SESSIONS_KEY, sessions);
    return updatedSession;
  }

  async getCurrentFocusSession(): Promise<FocusSession | null> {
    const sessions = await this.getFocusSessions();
    return sessions.find(s => !s.completed) || null;
  }

  // Habits
  async getHabits(): Promise<Habit[]> {
    return this.getFromStorage<Habit>(this.HABITS_KEY);
  }

  async createHabit(label: string): Promise<Habit> {
    const habits = await this.getHabits();
    const now = new Date();
    const habit: Habit = {
      id: this.generateId(),
      label,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
    habits.push(habit);
    this.saveToStorage(this.HABITS_KEY, habits);
    return habit;
  }

  async updateHabit(id: string, updates: Partial<Pick<Habit, 'label' | 'enabled'>>): Promise<Habit> {
    const habits = await this.getHabits();
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) throw new Error('Habit not found');

    const habit = habits[habitIndex];
    const updatedHabit = {
      ...habit,
      ...updates,
      updatedAt: new Date(),
    };
    habits[habitIndex] = updatedHabit;
    this.saveToStorage(this.HABITS_KEY, habits);
    return updatedHabit;
  }

  async deleteHabit(id: string): Promise<void> {
    const habits = await this.getHabits();
    const filteredHabits = habits.filter(h => h.id !== id);
    this.saveToStorage(this.HABITS_KEY, filteredHabits);
  }

  // Habit Completions
  async getHabitCompletions(date?: string): Promise<HabitCompletion[]> {
    const completions = this.getFromStorage<HabitCompletion>(this.COMPLETIONS_KEY);
    if (date) {
      return completions.filter(c => c.date === date);
    }
    return completions;
  }

  async toggleHabitCompletion(habitId: string, habitLabel: string, date: string, completed: boolean): Promise<HabitCompletion> {
    const completions = await this.getHabitCompletions();
    const existingIndex = completions.findIndex(c => c.habitId === habitId && c.date === date);

    if (existingIndex >= 0) {
      // Update existing completion
      const completion = completions[existingIndex];
      const updatedCompletion = {
        ...completion,
        completed,
        updatedAt: new Date(),
      };
      completions[existingIndex] = updatedCompletion;
      this.saveToStorage(this.COMPLETIONS_KEY, completions);
      return updatedCompletion;
    } else {
      // Create new completion
      const now = new Date();
      const completion: HabitCompletion = {
        id: this.generateId(),
        habitId,
        habitLabel,
        date,
        completed,
        createdAt: now,
        updatedAt: now,
      };
      completions.push(completion);
      this.saveToStorage(this.COMPLETIONS_KEY, completions);
      return completion;
    }
  }
}

// Global database instance
export const db = new LocalStorageDatabase();
