"use client";

import {
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronLeft,
  CircleHelp,
  Clock3,
  FileText,
  Flag,
  Lightbulb,
  MessageSquareText,
  Mic,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { BoardSignals, DiagramBoard } from "./DiagramBoard";
import {
  createArchitectReply,
  getNudge,
  Level,
  ScenarioId,
  scenarios,
  Topic,
  topicLabels,
} from "../lib/interview-engine";

type Message = {
  id: number;
  role: "architect" | "candidate" | "system";
  text: string;
};

const levelOptions: { id: Level; label: string; detail: string; expectations: string }[] = [
  {
    id: "junior",
    label: "Junior",
    detail: "0–2 years",
    expectations: "Guided fundamentals",
  },
  {
    id: "mid",
    label: "Mid-level",
    detail: "3–7 years",
    expectations: "Trade-offs & scale",
  },
  {
    id: "architect",
    label: "Senior architect",
    detail: "8+ years",
    expectations: "Ambiguity & leadership",
  },
];

const initialSignals: BoardSignals = {
  shapes: 0,
  connections: 0,
  labels: [],
  stores: 0,
  asyncComponents: 0,
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

export function InterviewApp() {
  const [phase, setPhase] = useState<"onboarding" | "interview">("onboarding");
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState<Level>("mid");
  const [scenarioId, setScenarioId] = useState<ScenarioId>("ticketing");
  const [resumeName, setResumeName] = useState("");
  const [resumeSummary, setResumeSummary] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [covered, setCovered] = useState<Topic[]>([]);
  const [signals, setSignals] = useState<BoardSignals>(initialSignals);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [showCoach, setShowCoach] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"discussion" | "canvas">("discussion");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageId = useRef(1);

  const scenario = useMemo(
    () => scenarios.find((candidate) => candidate.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
  }, [stopTimer]);

  const addMessage = useCallback((role: Message["role"], text: string) => {
    setMessages((current) => [...current, { id: messageId.current++, role, text }]);
  }, []);

  const beginInterview = () => {
    setPhase("interview");
    setMessages([
      {
        id: messageId.current++,
        role: "architect",
        text: `Welcome. Today I’d like you to ${scenario.name.toLowerCase()}.\n\nI’m intentionally leaving the brief broad. You own the room: ask questions, establish scope, make estimates where they matter, and evolve your design on the canvas. I’ll answer as the product and challenge you as the reviewing architect. Where would you like to begin?`,
      },
    ]);
    startTimer();
  };

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setResumeName(file.name);
    if (file.type.startsWith("text/") || file.name.endsWith(".md")) {
      const reader = new FileReader();
      reader.onload = () => setResumeSummary(String(reader.result ?? "").slice(0, 1200));
      reader.readAsText(file);
    }
  };

  const submitMessage = (event?: FormEvent) => {
    event?.preventDefault();
    const value = input.trim();
    if (!value) return;
    addMessage("candidate", value);
    const reply = createArchitectReply(value, {
      scenario,
      level,
      covered,
      turn: messages.filter((message) => message.role === "candidate").length,
    });
    setCovered((current) => Array.from(new Set([...current, ...reply.topics])));
    setInput("");
    window.setTimeout(() => addMessage("architect", reply.text), 350);
  };

  const askForReview = () => {
    const labelPreview = signals.labels.slice(0, 5).join(", ");
    const observations = [
      signals.shapes < 3 ? "I only see a few concrete components" : `I can see ${signals.shapes} component shapes`,
      signals.connections < 2 ? "the critical-path connections are still unclear" : `${signals.connections} connections are drawn`,
      signals.stores === 0 ? "and no labeled source of truth yet" : `and ${signals.stores} data or messaging signals`,
    ];
    const prompt = labelPreview
      ? `I’m reading labels such as ${labelPreview}. Pick the highest-risk arrow and explain its request contract, failure mode, and consistency expectation.`
      : "Add labels to the major components so we can review responsibilities rather than boxes.";
    addMessage("system", "Canvas review requested");
    window.setTimeout(
      () => addMessage("architect", `From the current canvas, ${observations.join(", ")}. ${prompt}`),
      250,
    );
    setMobilePanel("discussion");
  };

  const togglePause = () => {
    if (isPaused) startTimer();
    else stopTimer();
    setIsPaused((value) => !value);
  };

  const resetInterview = () => {
    stopTimer();
    setPhase("onboarding");
    setStep(1);
    setMessages([]);
    setCovered([]);
    setSignals(initialSignals);
    setSeconds(0);
    setShowDebrief(false);
  };

  if (phase === "onboarding") {
    return (
      <main className="onboarding-page">
        <header className="landing-header">
          <Brand />
          <div className="landing-note"><ShieldCheck size={16} /> Private by default · your files stay in this session</div>
        </header>

        <section className="onboarding-layout">
          <div className="onboarding-intro">
            <div className="eyebrow"><span /> Discussion-first practice</div>
            <h1>Think out loud.<br />Design under pressure.</h1>
            <p>
              A realistic system design room where an opinionated senior architect follows your reasoning,
              challenges your trade-offs, and reads the architecture you draw.
            </p>
            <div className="proof-row">
              <div><strong>40 min</strong><span>structured round</span></div>
              <div><strong>Live</strong><span>canvas feedback</span></div>
              <div><strong>No</strong><span>single right answer</span></div>
            </div>
          </div>

          <div className="setup-card" aria-label="Interview setup">
            <div className="setup-progress">
              <span>Interview setup</span>
              <span>Step {step} of 2</span>
            </div>
            <div className="progress-track"><span style={{ width: `${step * 50}%` }} /></div>

            {step === 1 ? (
              <div className="setup-content">
                <span className="step-kicker">Calibrate the room</span>
                <h2>What level are you interviewing for?</h2>
                <p>We’ll adjust ambiguity, depth, and how hard the interviewer pushes back.</p>
                <div className="level-list">
                  {levelOptions.map((option) => (
                    <button
                      className={`level-option ${level === option.id ? "selected" : ""}`}
                      key={option.id}
                      onClick={() => setLevel(option.id)}
                      type="button"
                    >
                      <span className="level-radio">{level === option.id && <span />}</span>
                      <span className="level-copy"><strong>{option.label}</strong><small>{option.detail}</small></span>
                      <span className="level-expectation">{option.expectations}</span>
                    </button>
                  ))}
                </div>
                <button className="primary-action" onClick={() => setStep(2)} type="button">
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className="setup-content">
                <button className="back-button" onClick={() => setStep(1)} type="button"><ChevronLeft size={16} /> Back</button>
                <span className="step-kicker">Personalize the round</span>
                <h2>Add context, then pick a problem.</h2>
                <p>Your resume helps frame follow-ups around your background. It never leaves this browser session.</p>

                <label className={`resume-drop ${resumeName ? "has-file" : ""}`}>
                  <input accept=".pdf,.doc,.docx,.txt,.md" onChange={handleFile} type="file" />
                  {resumeName ? <FileText size={23} /> : <Upload size={23} />}
                  <span><strong>{resumeName || "Upload your resume"}</strong><small>{resumeName ? "Ready for this session" : "PDF, DOCX, TXT · up to 10 MB"}</small></span>
                  {resumeName && <Check size={18} />}
                </label>

                <label className="summary-label">
                  <span>Role context <small>optional</small></span>
                  <textarea
                    onChange={(event) => setResumeSummary(event.target.value)}
                    placeholder="e.g. Backend engineer working on payments and event-driven systems"
                    value={resumeSummary}
                  />
                </label>

                <fieldset className="scenario-fieldset">
                  <legend>Choose today’s prompt</legend>
                  <div className="scenario-grid">
                    {scenarios.map((item) => (
                      <button
                        className={scenarioId === item.id ? "selected" : ""}
                        key={item.id}
                        onClick={() => setScenarioId(item.id)}
                        type="button"
                      >
                        <span>{item.shortName}</span><small>{item.accent}</small>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <button className="primary-action" onClick={beginInterview} type="button">
                  Enter the interview room <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </section>
        <div className="landing-marquee" aria-hidden="true">
          <span>CLARIFY</span><i /> <span>ESTIMATE</span><i /> <span>DESIGN</span><i /> <span>CHALLENGE</span><i /> <span>ITERATE</span>
        </div>
      </main>
    );
  }

  const score = Math.min(100, 24 + covered.length * 8 + Math.min(signals.shapes, 6) * 3 + Math.min(signals.connections, 5) * 2);

  return (
    <main className="interview-page">
      <header className="interview-header">
        <Brand compact />
        <div className="session-title">
          <span className="live-dot" />
          <div><strong>{scenario.shortName}</strong><small>{levelOptions.find((item) => item.id === level)?.label} round</small></div>
        </div>
        <div className="header-actions">
          <button className="timer-button" onClick={togglePause} type="button" aria-label={isPaused ? "Resume timer" : "Pause timer"}>
            <Clock3 size={16} /><span>{formatTime(seconds)}</span><small>{isPaused ? "paused" : "live"}</small>
          </button>
          <button className="end-button" onClick={() => { stopTimer(); setShowDebrief(true); }} type="button"><Flag size={15} /> End session</button>
        </div>
      </header>

      <nav className="mobile-tabs" aria-label="Interview workspace">
        <button className={mobilePanel === "discussion" ? "active" : ""} onClick={() => setMobilePanel("discussion")} type="button"><MessageSquareText size={16} /> Discussion</button>
        <button className={mobilePanel === "canvas" ? "active" : ""} onClick={() => setMobilePanel("canvas")} type="button"><BrainCircuit size={16} /> Canvas</button>
      </nav>

      <section className="workspace">
        <aside className={`discussion-panel ${mobilePanel === "discussion" ? "mobile-active" : ""}`}>
          <div className="interviewer-card">
            <div className="avatar">SA<span /></div>
            <div><strong>Maya Chen</strong><span>Principal architect · interviewer</span></div>
            <span className="listening"><Mic size={13} /> listening</span>
          </div>

          <div className="coverage-strip" aria-label="Interview coverage">
            {(Object.keys(topicLabels) as Topic[]).map((topic) => (
              <span className={covered.includes(topic) ? "covered" : ""} key={topic} title={topicLabels[topic]}>
                {covered.includes(topic) ? <Check size={11} /> : null}
              </span>
            ))}
            <small>{covered.length}/7 areas explored</small>
          </div>

          <div className="message-list" aria-live="polite">
            {messages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                <span className="message-role">{message.role === "architect" ? "Maya" : message.role === "candidate" ? "You" : "Canvas"}</span>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          <div className={`coach-note ${showCoach ? "" : "hidden"}`}>
            <Lightbulb size={16} />
            <p><strong>Room note</strong>{getNudge(covered)}</p>
            <button onClick={() => setShowCoach(false)} aria-label="Dismiss coaching note" type="button"><X size={14} /></button>
          </div>

          <form className="composer" onSubmit={submitMessage}>
            <textarea
              aria-label="Your response"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submitMessage();
                }
              }}
              placeholder="Ask a question or walk through your thinking…"
              rows={3}
              value={input}
            />
            <div className="composer-actions">
              <button className="attach-button" type="button" aria-label="Attach note"><Paperclip size={17} /></button>
              <span>↵ send · shift ↵ newline</span>
              <button className="send-button" disabled={!input.trim()} type="submit" aria-label="Send response"><Send size={17} /></button>
            </div>
          </form>
        </aside>

        <section className={`canvas-panel ${mobilePanel === "canvas" ? "mobile-active" : ""}`}>
          <div className="canvas-toolbar">
            <div>
              <span className="canvas-title"><BrainCircuit size={17} /> Architecture canvas</span>
              <span className="autosave"><span /> Session-local autosave</span>
            </div>
            <div className="canvas-actions">
              <button onClick={() => addMessage("architect", getNudge(covered))} type="button"><CircleHelp size={15} /> Nudge me</button>
              <button className="review-button" onClick={askForReview} type="button"><Sparkles size={15} /> Review my canvas</button>
            </div>
          </div>

          <div className="canvas-stage">
            <DiagramBoard onSignals={setSignals} />
            <div className="canvas-hint">
              <strong>{signals.shapes === 0 ? "Start with the critical path" : `${signals.shapes} components · ${signals.connections} connections`}</strong>
              <span>{signals.labels.length === 0 ? "Label each box so the interviewer can assess your design." : "The interviewer can read your labels and topology."}</span>
            </div>
          </div>
        </section>
      </section>

      {showDebrief && (
        <div className="modal-backdrop" role="presentation">
          <section className="debrief-modal" role="dialog" aria-modal="true" aria-labelledby="debrief-title">
            <button className="modal-close" onClick={() => setShowDebrief(false)} aria-label="Close debrief" type="button"><X size={19} /></button>
            <span className="debrief-kicker">Session debrief</span>
            <h2 id="debrief-title">A promising design with room to sharpen the argument.</h2>
            <div className="score-row">
              <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><span>{score}</span><small>/100</small></div>
              <p>You explored <strong>{covered.length} of 7</strong> design dimensions and drew <strong>{signals.shapes} components</strong> with <strong>{signals.connections} connections</strong>. This is directional feedback, not a model answer.</p>
            </div>
            <div className="debrief-grid">
              <div><Check size={17} /><span><strong>Keep doing</strong>{covered.length >= 3 ? "You moved across multiple design dimensions instead of fixating on technology." : "You made room for clarification before locking the architecture."}</span></div>
              <div><Lightbulb size={17} /><span><strong>Next rep</strong>{signals.connections < 3 ? "Narrate the critical path and label every important boundary." : "Push harder on partial failures and overloaded dependencies."}</span></div>
            </div>
            <div className="modal-actions">
              <button onClick={resetInterview} type="button"><RotateCcw size={16} /> New interview</button>
              <button className="primary-action" onClick={() => setShowDebrief(false)} type="button">Keep iterating <ArrowRight size={17} /></button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "compact" : ""}`}>
      <span className="brand-mark"><span /><span /><span /></span>
      <span><strong>ArchRoom</strong>{!compact && <small>System design studio</small>}</span>
    </div>
  );
}
