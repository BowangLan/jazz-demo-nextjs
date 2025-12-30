"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { db, type Habit, type HabitCompletion } from "@/lib/database";

export function DailyHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [newHabit, setNewHabit] = useState("");
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Load habits and today's completions on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedHabits, loadedCompletions] = await Promise.all([
          db.getHabits(),
          db.getHabitCompletions(today)
        ]);
        setHabits(loadedHabits.filter(h => h.enabled));
        setCompletions(loadedCompletions);
      } catch (error) {
        console.error('Failed to load habits:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [today]);

  const isHabitCompleted = (habitId: string) => {
    return completions.some(c => c.habitId === habitId && c.completed);
  };

  const habitProgress = useMemo(() => {
    if (habits.length === 0) {
      return 0;
    }
    const complete = habits.filter((habit) => isHabitCompleted(habit.id)).length;
    return Math.round((complete / habits.length) * 100);
  }, [habits, completions]);

  const handleAddHabit = async () => {
    const trimmed = newHabit.trim();
    if (!trimmed) return;

    try {
      const newHabitItem = await db.createHabit(trimmed);
      setHabits(prev => [...prev, newHabitItem]);
      setNewHabit("");
    } catch (error) {
      console.error('Failed to add habit:', error);
    }
  };

  const handleToggleHabit = async (habitId: string, habitLabel: string, completed: boolean) => {
    try {
      const completion = await db.toggleHabitCompletion(habitId, habitLabel, today, completed);
      setCompletions(prev => {
        const existing = prev.findIndex(c => c.habitId === habitId && c.date === today);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = completion;
          return updated;
        } else {
          return [...prev, completion];
        }
      });
    } catch (error) {
      console.error('Failed to toggle habit completion:', error);
    }
  };

  const handleResetDay = () => {
    setCompletions([]);
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Daily habits</CardTitle>
          <CardDescription>Loading habits...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Daily habits</CardTitle>
        <CardDescription>
          Track repeatable wins with daily persistence.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add a new habit"
            value={newHabit}
            onChange={(event) => setNewHabit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleAddHabit();
              }
            }}
          />
          <Button onClick={handleAddHabit}>Add</Button>
        </div>

        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>{habitProgress}% complete</span>
          <span>
            {habits.filter((habit) => isHabitCompleted(habit.id)).length}/{habits.length} done
          </span>
        </div>
        <Progress value={habitProgress} />
        <div className="flex flex-col gap-3">
          {habits.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No habits yet — add your first one.
            </p>
          ) : (
            habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <span>{habit.label}</span>
                <Switch
                  checked={isHabitCompleted(habit.id)}
                  onCheckedChange={(checked) => handleToggleHabit(habit.id, habit.label, checked)}
                />
              </div>
            ))
          )}
        </div>
        <Button
          variant="secondary"
          onClick={handleResetDay}
        >
          Reset today's check-ins
        </Button>
      </CardContent>
    </Card>
  );
}
