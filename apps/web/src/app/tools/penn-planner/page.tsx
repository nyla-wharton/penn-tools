"use client";

import { useMemo, useState } from "react";
import styles from "./page.module.css";

type TaskStatus = "pending" | "in_progress" | "completed";
type Source = "careerpath" | "canvas";
type FilterTab = "all" | TaskStatus;

type Task = {
  id: string;
  rank: number;
  title: string;
  source: Source;
  sourceLabel: string;
  courseOrCompany: string;
  dueSummary: string;
  // Human-readable due meta for display
  dueDetail: string;
  timeEst: string;
  status: TaskStatus;
};

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    rank: 1,
    title: "McKinsey First Round Interview",
    source: "careerpath",
    sourceLabel: "CareerPath",
    courseOrCompany: "McKinsey & Company",
    dueSummary: "Due tomorrow",
    dueDetail: "Mar 24, 11:59 PM",
    timeEst: "~45 min",
    status: "pending",
  },
  {
    id: "2",
    rank: 2,
    title: "Goldman Sachs Application Deadline",
    source: "careerpath",
    sourceLabel: "CareerPath",
    courseOrCompany: "Goldman Sachs",
    dueSummary: "Due in 2–3 days",
    dueDetail: "Mar 25, 11:59 PM",
    timeEst: "~68 min",
    status: "pending",
  },
  {
    id: "3",
    rank: 3,
    title: "MGMT 611: Strategy Case Write-up",
    source: "canvas",
    sourceLabel: "Canvas",
    courseOrCompany: "MGMT 611: Strategy",
    dueSummary: "Due tomorrow",
    dueDetail: "Mar 24, 11:59 PM",
    timeEst: "~68 min",
    status: "pending",
  },
  {
    id: "4",
    rank: 4,
    title: "MKTG 612: Midterm Exam",
    source: "canvas",
    sourceLabel: "Canvas",
    courseOrCompany: "MKTG 612: Marketing Management",
    dueSummary: "Due in 4 days",
    dueDetail: "Mar 28, 11:59 PM",
    timeEst: "~135 min",
    status: "pending",
  },
];

function rankClass(rank: number): string {
  if (rank <= 3) return styles.rankHigh;
  return styles.rankMid;
}

export default function PennPlannerPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingText, setBriefingText] = useState<string | null>(null);

  const pending = useMemo(() => tasks.filter((t) => t.status === "pending" || t.status === "in_progress"), [tasks]);
  const completed = useMemo(() => tasks.filter((t) => t.status === "completed"), [tasks]);
  const dueSoon = useMemo(() => pending.filter((t) => t.dueSummary === "Due tomorrow"), [pending]);

  const visible = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  function setInProgress(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "in_progress" as const } : t)));
  }

  function setDone(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: "completed" as const } : t)));
  }

  function addTask() {
    const nextRank = Math.max(0, ...tasks.map((t) => t.rank)) + 1;
    setTasks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        rank: nextRank,
        title: "New task",
        source: "canvas",
        sourceLabel: "Canvas",
        courseOrCompany: "—",
        dueSummary: "No due date",
        dueDetail: "",
        timeEst: "",
        status: "pending",
      },
    ]);
  }

  async function syncCanvas() {
    // Placeholder — wire to Canvas / CareerPath APIs when available
    alert("Sync with Canvas & CareerPath would run here.");
  }

  async function getBriefing() {
    setBriefingLoading(true);
    setBriefingText(null);
    try {
      const lines = pending.slice(0, 6).map((t) => `• ${t.title} (${t.dueSummary})`);
      const prompt = `Write a short daily briefing (3-5 bullet sentences) for a Wharton student based on these upcoming items:\n${lines.join("\n")}`;
      const storedKey = typeof window !== "undefined" ? (localStorage.getItem("penntools_api_key") ?? "") : "";
      const res = await fetch("/api/llm/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(storedKey ? { "X-Api-Key": storedKey } : {}),
        },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBriefingText(typeof data.content === "string" ? data.content : JSON.stringify(data));
    } catch {
      setBriefingText("Could not load briefing. Configure an API key in AskPenn or add OPENAI_API_KEY / ANTHROPIC_API_KEY for the app.");
    } finally {
      setBriefingLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <h1>Penn Planner</h1>
            <p className={styles.tagline}>Your AI academic & recruiting planner</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.btnSync} onClick={syncCanvas}>
              Sync Canvas & CareerPath
            </button>
            <button type="button" className={styles.btnPrimary} onClick={addTask}>
              + Add Task
            </button>
          </div>
        </header>

        <section className={styles.statsRow} aria-label="Overview">
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.pending}`}>{pending.length}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.completed}`}>{completed.length}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statValue} ${styles.due}`}>{dueSoon.length}</div>
            <div className={styles.statLabel}>Due in 48h</div>
          </div>
        </section>

        <div className={styles.alert} role="status">
          <span className={styles.alertIcon} aria-hidden>
            📣
          </span>
          <span>
            Interview coming up: &ldquo;McKinsey First Round Interview&rdquo; — make sure your case prep is ready.
          </span>
        </div>

        <section className={styles.briefing} aria-labelledby="briefing-heading">
          <div className={styles.briefingText}>
            <h2 id="briefing-heading">AI Daily Briefing</h2>
            <p>
              Get a quick read on deadlines and interviews based on your synced Canvas courses and CareerPath roles.
            </p>
            {briefingText ? <div className={styles.briefingResult}>{briefingText}</div> : null}
          </div>
          <button type="button" className={styles.btnBriefing} onClick={getBriefing} disabled={briefingLoading}>
            {briefingLoading ? "Working…" : "Get Briefing"}
          </button>
        </section>

        <div className={styles.tabs} role="tablist" aria-label="Task filters">
          {(
            [
              ["all", "All"],
              ["pending", "Pending"],
              ["in_progress", "In Progress"],
              ["completed", "Completed"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={filter === key}
              className={[styles.tab, filter === key ? styles.tabActive : ""].join(" ")}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <ul className={styles.taskList}>
          {visible.map((task) => (
            <li key={task.id} className={styles.taskCard}>
              <div className={`${styles.rank} ${rankClass(task.rank)}`} aria-hidden>
                {task.rank}
              </div>
              <div className={styles.taskBody}>
                <h3 className={styles.taskTitle}>{task.title}</h3>
                <div className={styles.metaRow}>
                  <span
                    className={`${styles.sourceTag} ${
                      task.source === "careerpath" ? styles.sourceCareer : styles.sourceCanvas
                    }`}
                  >
                    {task.source === "careerpath" ? "💼" : "📘"} {task.sourceLabel}
                  </span>
                  <span className={styles.sourceSub}>{task.courseOrCompany}</span>
                </div>
                <div className={styles.dueLine}>
                  <strong>{task.dueSummary}</strong>
                  {task.dueDetail ? ` • ${task.dueDetail}` : ""}
                  {task.timeEst ? <span className={styles.timeEst}> • {task.timeEst}</span> : null}
                </div>
              </div>
              <div className={styles.taskActions}>
                {task.status !== "completed" ? (
                  <>
                    <button type="button" className={styles.btnOutline} onClick={() => setInProgress(task.id)}>
                      Start
                    </button>
                    <button type="button" className={styles.btnDone} onClick={() => setDone(task.id)}>
                      Done
                    </button>
                  </>
                ) : (
                  <span className={styles.sourceSub}>Completed</span>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.issuePill}>1 Issue</div>
      </div>
    </div>
  );
}
