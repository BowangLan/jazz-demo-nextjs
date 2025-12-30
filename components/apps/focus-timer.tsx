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
import { Progress } from "@/components/ui/progress";
import { db, type FocusSession } from "@/lib/database";

const focusSessionSeconds = 25 * 60;

export function FocusTimer() {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [completedSessions, setCompletedSessions] = useState<FocusSession[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const [current, allSessions] = await Promise.all([
          db.getCurrentFocusSession(),
          db.getFocusSessions()
        ]);
        setCurrentSession(current);
        setCompletedSessions(allSessions.filter(s => s.completed));
        if (current) {
          const elapsed = Math.floor((Date.now() - current.startTime.getTime()) / 1000);
          const remaining = Math.max(0, current.duration - elapsed);
          setIsRunning(remaining > 0);
        }
      } catch (error) {
        console.error('Failed to load focus sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, []);

  useEffect(() => {
    if (!isRunning || !currentSession) {
      return;
    }

    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000);
      const remaining = Math.max(0, currentSession.duration - elapsed);

      if (remaining <= 0) {
        setIsRunning(false);
        handleCompleteSession();
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, currentSession]);

  const secondsRemaining = useMemo(() => {
    if (!currentSession) return focusSessionSeconds;
    const elapsed = Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000);
    return Math.max(0, currentSession.duration - elapsed);
  }, [currentSession]);

  const timerProgress = useMemo(() => {
    if (!currentSession) return 0;
    const elapsed = Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000);
    return Math.min(100, Math.round((elapsed / currentSession.duration) * 100));
  }, [currentSession]);

  const formattedTime = useMemo(() => {
    const minutes = Math.floor(secondsRemaining / 60);
    const seconds = secondsRemaining % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, [secondsRemaining]);

  const handleStartSession = async () => {
    try {
      const session = await db.startFocusSession();
      setCurrentSession(session);
      setIsRunning(true);
    } catch (error) {
      console.error('Failed to start focus session:', error);
    }
  };

  const handleCompleteSession = async () => {
    if (!currentSession) return;
    try {
      const completedSession = await db.completeFocusSession(
        currentSession.id,
        Math.floor((Date.now() - currentSession.startTime.getTime()) / 1000)
      );
      setCompletedSessions(prev => [completedSession, ...prev]);
      setCurrentSession(null);
      setIsRunning(false);
    } catch (error) {
      console.error('Failed to complete focus session:', error);
    }
  };

  const handleReset = () => {
    setCurrentSession(null);
    setIsRunning(false);
  };

  if (loading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Focus timer</CardTitle>
          <CardDescription>Loading focus sessions...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Focus timer</CardTitle>
        <CardDescription>
          A 25-minute sprint with session tracking.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-6 text-center text-4xl font-semibold tracking-widest shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {formattedTime}
        </div>
        <Progress value={timerProgress} />
        <div className="flex gap-2">
          <Button
            onClick={currentSession ? (isRunning ? () => setIsRunning(false) : () => setIsRunning(true)) : handleStartSession}
            className="flex-1"
          >
            {currentSession ? (isRunning ? "Pause" : "Resume") : "Start"}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>

        {completedSessions.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Recent Sessions</h4>
            <div className="space-y-1">
              {completedSessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex justify-between text-xs text-zinc-500">
                  <span>
                    {session.startTime.toLocaleDateString()} at {session.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <span>{Math.round(session.duration / 60)}m</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-zinc-500">
          Tip: mute notifications and pick one task. Sessions are automatically saved.
        </p>
      </CardContent>
    </Card>
  );
}
