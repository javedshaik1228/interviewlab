"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Code2,
  ExternalLink,
  FileWarning,
  Lightbulb,
  MessageSquareText,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";
import type { Level } from "../lib/interview-engine";
import { buildCodingNotes, CodingMessage, createCodingReply } from "../lib/coding-engine";
import { pickRandomCodingProblem } from "../lib/neetcode-catalog";

type Props = {
  level: Level;
  language: string;
  seconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onFinish: () => void;
  onReset: () => void;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export function CodingInterview({ level, language, seconds, isPaused, onTogglePause, onFinish, onReset }: Props) {
  const [problem] = useState(() => pickRandomCodingProblem(level));
  const commentPrefix = language === "Python" ? "#" : "//";
  const [messages, setMessages] = useState<CodingMessage[]>([
    {
      id: 1,
      role: "interviewer",
      text: `Your coding challenge is “${problem.title}.” Open the full prompt, clarify anything ambiguous, and talk through a correct baseline before you code.\n\nA brute-force solution is acceptable. I will still ask you to identify its complexity and work toward the optimal pattern.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState(`${commentPrefix} ${language} draft for ${problem.title}\n${commentPrefix} Talk through your invariant and complexity as you work.\n\n`);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [workspaceTab, setWorkspaceTab] = useState<"problem" | "code">("problem");
  const [problemLoaded, setProblemLoaded] = useState(false);
  const messageId = useRef(2);

  const notes = useMemo(
    () => buildCodingNotes(problem, messages, code, hintsUsed),
    [problem, messages, code, hintsUsed],
  );

  const submitMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const value = input.trim();
    if (!value) return;
    const turn = messages.filter((message) => message.role === "candidate").length;
    const asksForNudge = /hint|stuck|help|brute|not sure|don.?t know/i.test(value);
    if (asksForNudge) setHintsUsed((current) => current + 1);
    setMessages((current) => [...current, { id: messageId.current++, role: "candidate", text: value }]);
    setInput("");
    window.setTimeout(() => {
      setMessages((current) => [...current, {
        id: messageId.current++,
        role: "interviewer",
        text: createCodingReply(value, problem, turn),
      }]);
    }, 300);
  };

  const requestNudge = () => {
    setHintsUsed((current) => current + 1);
    setMessages((current) => [...current, {
      id: messageId.current++,
      role: "interviewer",
      text: `Optimization nudge: ${problem.optimizationHint}. First identify the repeated work, then state the invariant that removes it.`,
    }]);
  };

  const submitSolution = () => {
    onFinish();
    setShowNotes(true);
  };

  return (
    <main className="interview-page coding-round-page">
      <header className="interview-header">
        <div className="brand compact">
          <span className="brand-mark"><span /><span /><span /></span>
          <span><strong>ArchRoom</strong></span>
        </div>
        <div className="session-title coding-session-title">
          <span className="live-dot" />
          <div><strong>{problem.title}</strong><small>NeetCode 150 · {problem.category}</small></div>
        </div>
        <div className="header-actions">
          <button className="timer-button" onClick={onTogglePause} type="button" aria-label={isPaused ? "Resume timer" : "Pause timer"}>
            <Clock3 size={16} /><span>{formatTime(seconds)}</span><small>{isPaused ? "paused" : "live"}</small>
          </button>
          <button className="submit-solution-button" onClick={submitSolution} type="button"><CheckCircle2 size={15} /> Submit solution</button>
        </div>
      </header>

      <section className="coding-workspace">
        <aside className="coding-discussion">
          <div className="coding-problem-card">
            <div>
              <span className={`difficulty-pill ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
              <span>{problem.category}</span>
            </div>
            <h1>{problem.title}</h1>
            <p>Read the complete official prompt in the Problem tab, then clarify, reason, implement, and optimize without leaving ArchRoom.</p>
            <a href={problem.sourceUrl} target="_blank" rel="noreferrer">Open directly if the embed is unavailable <ExternalLink size={12} /></a>
          </div>

          <div className="coding-message-list" aria-live="polite">
            {messages.map((message) => (
              <article className={`message ${message.role === "interviewer" ? "architect" : message.role}`} key={message.id}>
                <span className="message-role">{message.role === "interviewer" ? "Interviewer" : message.role === "candidate" ? "You" : "Note"}</span>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          <div className="coding-nudge-row">
            <button onClick={requestNudge} type="button"><Lightbulb size={14} /> Optimization nudge</button>
            <span>{hintsUsed} nudges used</span>
          </div>

          <form className="composer coding-composer" onSubmit={submitMessage}>
            <textarea
              aria-label="Explain your coding approach"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitMessage();
                }
              }}
              placeholder="Clarify constraints, explain an approach, or ask for a hint…"
              rows={3}
              value={input}
            />
            <div className="composer-actions">
              <span>Brute force is accepted · optimization is still discussed</span>
              <button className="send-button" disabled={!input.trim()} type="submit" aria-label="Send response"><Send size={17} /></button>
            </div>
          </form>
        </aside>

        <section className="code-panel">
          <div className="code-toolbar">
            <div className="code-workspace-tabs" role="tablist" aria-label="Coding workspace">
              <button
                aria-controls="problem-workspace"
                aria-selected={workspaceTab === "problem"}
                className={workspaceTab === "problem" ? "active" : ""}
                onClick={() => setWorkspaceTab("problem")}
                role="tab"
                type="button"
              >
                <BookOpen size={15} /> Problem
              </button>
              <button
                aria-controls="code-workspace"
                aria-selected={workspaceTab === "code"}
                className={workspaceTab === "code" ? "active" : ""}
                onClick={() => setWorkspaceTab("code")}
                role="tab"
                type="button"
              >
                <Code2 size={15} /> Code <span>{language}</span>
              </button>
            </div>
            <div className="complexity-target"><Target size={14} /><span>Target: {problem.targetComplexity}</span></div>
          </div>
          <div className="embedded-problem" hidden={workspaceTab !== "problem"} id="problem-workspace" role="tabpanel">
            {!problemLoaded && (
              <div className="problem-frame-loading" aria-live="polite">
                <span className="canvas-loading-mark">AR</span>
                <strong>Loading the official problem…</strong>
                <small>The question, examples, constraints, hints, and solutions are served by NeetCode.</small>
              </div>
            )}
            <iframe
              onLoad={() => setProblemLoaded(true)}
              referrerPolicy="strict-origin-when-cross-origin"
              src={problem.sourceUrl}
              title={`${problem.title} — official NeetCode problem`}
            />
          </div>
          <textarea
            aria-label="Solution code editor"
            className="code-editor"
            hidden={workspaceTab !== "code"}
            id="code-workspace"
            onChange={(event) => setCode(event.target.value)}
            role="tabpanel"
            spellCheck={false}
            value={code}
          />
          {workspaceTab === "problem" ? (
            <footer className="code-footer problem-footer">
              <span><BookOpen size={13} /> Official content stays on NeetCode and is displayed inside ArchRoom.</span>
              <button onClick={() => setWorkspaceTab("code")} type="button">Start coding <ArrowRight size={14} /></button>
            </footer>
          ) : (
            <footer className="code-footer">
              <span><Sparkles size={13} /> Explain correctness and complexity in the discussion.</span>
              <button onClick={submitSolution} type="button">Submit & view notes <ArrowRight size={14} /></button>
            </footer>
          )}
        </section>
      </section>

      {showNotes && (
        <div className="modal-backdrop" role="presentation">
          <section className="coding-notes-modal" role="dialog" aria-modal="true" aria-labelledby="coding-notes-title">
            <button className="modal-close" onClick={() => setShowNotes(false)} aria-label="Close notes" type="button"><X size={19} /></button>
            <span className="debrief-kicker">Question notes</span>
            <h2 id="coding-notes-title">{problem.title}</h2>
            <p className="notes-summary">{notes.summary}</p>

            <div className="notes-grid">
              <NotesSection icon={<Target size={16} />} title="Approaches captured" items={notes.approaches} />
              <NotesSection icon={<CheckCircle2 size={16} />} title="What worked" items={notes.strengths} />
              <NotesSection icon={<FileWarning size={16} />} title="Pitfalls" items={notes.pitfalls} warning />
              <NotesSection icon={<Lightbulb size={16} />} title="Challenges faced" items={notes.challenges} />
            </div>

            <div className="input-notes">
              <h3><MessageSquareText size={14} /> Candidate input notes</h3>
              {notes.inputLog.length ? notes.inputLog.map((entry, index) => <p key={`${entry}-${index}`}>{entry}</p>) : <p>No discussion input was submitted.</p>}
            </div>

            <div className="modal-actions">
              <button onClick={onReset} type="button"><RotateCcw size={16} /> New interview</button>
              <button className="primary-action" onClick={() => setShowNotes(false)} type="button">Keep improving <ArrowRight size={17} /></button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function NotesSection({ icon, title, items, warning = false }: { icon: React.ReactNode; title: string; items: string[]; warning?: boolean }) {
  return (
    <section className={warning ? "warning" : ""}>
      <h3>{icon}{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}
