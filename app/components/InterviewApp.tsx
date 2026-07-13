"use client";

import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronLeft,
  CircleHelp,
  Clock3,
  Code2,
  Flag,
  ExternalLink,
  Lightbulb,
  MessageSquareText,
  Mic,
  Paperclip,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { BoardSignals, DiagramBoard } from "./DiagramBoard";
import {
  createArchitectReply,
  deliveryFramework,
  getGuidedFollowUp,
  getGuidedNudge,
  getNudge,
  Level,
  ScenarioId,
  SessionMode,
  Topic,
  topicLabels,
} from "../lib/interview-engine";
import { pickRandomScenario, questionSourceUrl, scenarios } from "../lib/question-catalog";
import { assessDesign } from "../lib/design-assessment";
import { CodingInterview } from "./CodingInterview";

type RoundType = "system-design" | "leetcode";

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
  const [roundType, setRoundType] = useState<RoundType>("system-design");
  const [codingLanguage, setCodingLanguage] = useState("Python");
  const [sessionMode, setSessionMode] = useState<SessionMode>("mock");
  const [scenarioId, setScenarioId] = useState<ScenarioId>("bitly");
  const [scenarioQuery, setScenarioQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [covered, setCovered] = useState<Topic[]>([]);
  const [signals, setSignals] = useState<BoardSignals>(initialSignals);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDebrief, setShowDebrief] = useState(false);
  const [showCoach, setShowCoach] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<"discussion" | "canvas">("discussion");
  const [frameworkStepIndex, setFrameworkStepIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messageId = useRef(1);

  const scenario = useMemo(
    () => scenarios.find((candidate) => candidate.id === scenarioId) ?? scenarios[0],
    [scenarioId],
  );
  const frameworkStage = deliveryFramework[frameworkStepIndex];
  const candidateText = useMemo(
    () => messages.filter((message) => message.role === "candidate").map((message) => message.text).join(" "),
    [messages],
  );
  const assessment = useMemo(() => assessDesign(candidateText, signals), [candidateText, signals]);
  const filteredScenarios = useMemo(() => {
    const query = scenarioQuery.trim().toLowerCase();
    if (!query) return scenarios;
    return scenarios.filter((item) => `${item.shortName} ${item.name} ${item.brief} ${item.accent}`.toLowerCase().includes(query));
  }, [scenarioQuery]);

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
    if (roundType === "leetcode") {
      setPhase("interview");
      startTimer();
      return;
    }
    const selectedScenario = sessionMode === "mock" ? pickRandomScenario() : scenario;
    setScenarioId(selectedScenario.id);
    setFrameworkStepIndex(0);
    setPhase("interview");
    setMessages([
      {
        id: messageId.current++,
        role: "architect",
        text: sessionMode === "guided"
          ? `Welcome to a guided learning session. Today you’ll ${selectedScenario.name.toLowerCase()}.\n\nFollow the six-stage delivery framework shown below. I’ll keep you moving, explain what each stage is for, and nudge you toward useful questions without handing you a model answer.\n\nStart with requirements: ask me about the two or three core user journeys, then identify the measurable system qualities that will shape your design.`
          : `Your random challenge is: ${selectedScenario.name}.\n\nI’m intentionally leaving the brief broad. You own the room: ask questions, establish scope, make estimates where they matter, and evolve your design on the canvas. There is no reference answer to match; I will assess how clearly you reason about trade-offs. Where would you like to begin?`,
      },
    ]);
    startTimer();
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
    const liveAssessment = assessDesign(`${candidateText} ${value}`, signals);
    const replyText = sessionMode === "guided"
      ? `${reply.text}\n\n${getGuidedFollowUp(frameworkStage)}`
      : `${reply.text}\n\nArchitect probe: ${liveAssessment.nextProbe}`;
    setCovered((current) => Array.from(new Set([...current, ...reply.topics])));
    setInput("");
    window.setTimeout(() => addMessage("architect", replyText), 350);
  };

  const advanceFramework = () => {
    const nextStage = deliveryFramework[frameworkStepIndex + 1];
    if (!nextStage) {
      addMessage("architect", "You’ve completed the delivery path. Use the remaining time to revisit the weakest assumption in your design and invite one final probe.");
      return;
    }

    setFrameworkStepIndex((current) => current + 1);
    addMessage("system", `Guide · ${nextStage.label}`);
    window.setTimeout(
      () => addMessage("architect", `Next stage: ${nextStage.label}. ${getGuidedNudge(nextStage, scenario)}`),
      200,
    );
  };

  const askForReview = () => {
    const labelPreview = signals.labels.slice(0, 5).join(", ");
    const observations = [
      signals.shapes < 3 ? "I only see a few concrete components" : `I can see ${signals.shapes} component shapes`,
      signals.connections < 2 ? "the critical-path connections are still unclear" : `${signals.connections} connections are drawn`,
      signals.stores === 0 ? "and no labeled source of truth yet" : `and ${signals.stores} data or messaging signals`,
    ];
    const prompt = labelPreview
      ? `I’m reading labels such as ${labelPreview}. Pick the highest-risk arrow and explain its request contract, failure mode, and consistency expectation. ${assessment.nextProbe}`
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
    setFrameworkStepIndex(0);
    setSeconds(0);
    setShowDebrief(false);
    setIsPaused(false);
  };

  const activeNudge = sessionMode === "guided"
    ? getGuidedNudge(frameworkStage, scenario)
    : assessment.nextProbe || getNudge(covered);

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
              A realistic interview studio for architecture and coding rounds. The interviewer follows your reasoning,
              challenges trade-offs, nudges optimization, and records what made the problem difficult.
            </p>
            <div className="proof-row">
              <div><strong>180</strong><span>curated problems</span></div>
              <div><strong>Live</strong><span>adaptive probes</span></div>
              <div><strong>Notes</strong><span>after submission</span></div>
            </div>
          </div>

          <div className="setup-card" aria-label="Interview setup">
            <div className="setup-progress">
              <span>Interview setup</span>
              <span>Step {step} of 3</span>
            </div>
            <div className="progress-track"><span style={{ width: `${(step / 3) * 100}%` }} /></div>

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
            ) : step === 2 ? (
              <div className="setup-content">
                <button className="back-button" onClick={() => setStep(1)} type="button"><ChevronLeft size={16} /> Back</button>
                <span className="step-kicker">Choose the interview</span>
                <h2>Which room are you entering?</h2>
                <p>Practice architecture discussion or solve a coding problem from the verified NeetCode 150 catalog.</p>

                <div className="mode-list">
                  <button
                    className={`mode-option ${roundType === "system-design" ? "selected" : ""}`}
                    onClick={() => setRoundType("system-design")}
                    type="button"
                  >
                    <span className="mode-icon"><BrainCircuit size={20} /></span>
                    <span><strong>System design</strong><small>Clarify requirements, draw the architecture, and defend trade-offs.</small></span>
                    <span className="mode-check">{roundType === "system-design" && <Check size={14} />}</span>
                  </button>
                  <button
                    className={`mode-option ${roundType === "leetcode" ? "selected" : ""}`}
                    onClick={() => setRoundType("leetcode")}
                    type="button"
                  >
                    <span className="mode-icon coding"><Code2 size={20} /></span>
                    <span><strong>LeetCode round</strong><small>A level-calibrated problem drawn only from NeetCode 150, with optimization nudges and final notes.</small></span>
                    <span className="mode-check">{roundType === "leetcode" && <Check size={14} />}</span>
                  </button>
                </div>

                {roundType === "system-design" ? (
                  <div className="practice-style">
                    <span>Practice style</span>
                    <div>
                      <button className={sessionMode === "mock" ? "selected" : ""} onClick={() => setSessionMode("mock")} type="button"><Mic size={13} /> Mock interview</button>
                      <button className={sessionMode === "guided" ? "selected" : ""} onClick={() => setSessionMode("guided")} type="button"><BookOpen size={13} /> Guided learning</button>
                    </div>
                  </div>
                ) : (
                  <div className="coding-mode-note"><Code2 size={15} /><span><strong>Correct baseline first</strong>Brute force is accepted; the interviewer then nudges you toward the expected optimal complexity.</span></div>
                )}

                {roundType === "system-design" && sessionMode === "guided" && (
                  <div className="framework-preview">
                    <div><BookOpen size={15} /><strong>Delivery path</strong><span>about 40 minutes</span></div>
                    <ol>
                      {deliveryFramework.map((stage) => <li key={stage.id}>{stage.shortLabel}</li>)}
                    </ol>
                    <a href="https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery" target="_blank" rel="noreferrer">
                      Based on Hello Interview’s Delivery Framework <ExternalLink size={11} />
                    </a>
                  </div>
                )}

                <button className="primary-action" onClick={() => setStep(3)} type="button">
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <div className="setup-content">
                <button className="back-button" onClick={() => setStep(2)} type="button"><ChevronLeft size={16} /> Back</button>
                <span className="step-kicker">Ready the round</span>
                <h2>{roundType === "leetcode" ? "Set up your coding round." : sessionMode === "mock" ? "Your problem stays a surprise." : "Choose a design problem."}</h2>
                <p>{roundType === "leetcode" ? "Choose a language, then receive a level-calibrated problem." : "The room is already calibrated to your selected experience level."}</p>

                {roundType === "leetcode" ? (
                  <>
                    <label className="language-select">
                      <span>Preferred coding language</span>
                      <select onChange={(event) => setCodingLanguage(event.target.value)} value={codingLanguage}>
                        {['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust'].map((language) => <option key={language}>{language}</option>)}
                      </select>
                    </label>
                    <div className="random-prompt-card coding-random-card">
                      <Code2 size={19} />
                      <span><strong>Random challenge from NeetCode 150</strong><small>The difficulty is calibrated to your experience level. Notes capture your approaches, pitfalls, and challenges when you submit.</small></span>
                    </div>
                    <a className="neetcode-source" href="https://neetcode.io/practice/practice/neetcode150" target="_blank" rel="noreferrer">Verified NeetCode 150 catalog <ExternalLink size={10} /></a>
                  </>
                ) : sessionMode === "mock" ? (
                  <div className="random-prompt-card">
                    <Sparkles size={19} />
                    <span><strong>Random challenge from 30 problems</strong><small>The prompt is revealed when you enter the room, so the mock stays realistic.</small></span>
                  </div>
                ) : (
                  <fieldset className="scenario-fieldset">
                    <legend>Choose today’s guided problem <small>{scenarios.length} available</small></legend>
                    <label className="scenario-search">
                      <Search size={14} />
                      <input aria-label="Search design problems" onChange={(event) => setScenarioQuery(event.target.value)} placeholder="Search Bitly, payments, realtime…" value={scenarioQuery} />
                    </label>
                    <div className="scenario-grid scenario-catalog">
                      {filteredScenarios.map((item) => (
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
                )}

                <button className="primary-action" onClick={beginInterview} type="button">
                  Enter the {roundType === "leetcode" ? "coding" : "interview"} room <ArrowRight size={18} />
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

  if (roundType === "leetcode") {
    return (
      <CodingInterview
        isPaused={isPaused}
        language={codingLanguage}
        level={level}
        onFinish={stopTimer}
        onReset={resetInterview}
        onTogglePause={togglePause}
        seconds={seconds}
      />
    );
  }

  return (
    <main className="interview-page">
      <header className="interview-header">
        <Brand compact />
        <div className="session-title">
          <span className="live-dot" />
          <div><strong>{scenario.shortName}</strong><small>{sessionMode === "guided" ? "Guided learning" : `${levelOptions.find((item) => item.id === level)?.label} round`}</small></div>
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

          {sessionMode === "guided" ? (
            <div className="guided-strip" aria-label="Guided framework progress">
              {deliveryFramework.map((stage, index) => (
                <span
                  className={index < frameworkStepIndex ? "done" : index === frameworkStepIndex ? "current" : ""}
                  key={stage.id}
                  title={`${stage.label} · ${stage.duration}`}
                >
                  {index < frameworkStepIndex ? <Check size={10} /> : index + 1}
                </span>
              ))}
              <small>{frameworkStepIndex + 1}/6 · {frameworkStage.shortLabel}</small>
            </div>
          ) : (
            <div className="coverage-strip" aria-label="Interview coverage">
              {(Object.keys(topicLabels) as Topic[]).map((topic) => (
                <span className={covered.includes(topic) ? "covered" : ""} key={topic} title={topicLabels[topic]}>
                  {covered.includes(topic) ? <Check size={11} /> : null}
                </span>
              ))}
              <small>{covered.length}/7 areas explored</small>
            </div>
          )}

          <div className="message-list" aria-live="polite">
            {messages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                <span className="message-role">{message.role === "architect" ? "Maya" : message.role === "candidate" ? "You" : "Canvas"}</span>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          {sessionMode === "guided" ? (
            <div className="guided-coach">
              <div className="guided-coach-heading">
                <BookOpen size={15} />
                <span>Step {frameworkStepIndex + 1}</span>
                <strong>{frameworkStage.label}</strong>
                <small>{frameworkStage.duration}</small>
              </div>
              <p>{frameworkStage.goal}</p>
              <div className="question-starters" aria-label="Suggested questions">
                {frameworkStage.questions.map((question) => (
                  <button key={question} onClick={() => setInput(question)} type="button">{question}</button>
                ))}
              </div>
              <div className="guided-coach-footer">
                <a href="https://www.hellointerview.com/learn/system-design/in-a-hurry/delivery" target="_blank" rel="noreferrer">
                  Framework guide <ExternalLink size={10} />
                </a>
                <button onClick={advanceFramework} type="button" disabled={frameworkStepIndex === deliveryFramework.length - 1}>
                  {frameworkStepIndex === deliveryFramework.length - 1 ? "Final stage" : `Next · ${deliveryFramework[frameworkStepIndex + 1].shortLabel}`}
                  {frameworkStepIndex < deliveryFramework.length - 1 && <ArrowRight size={12} />}
                </button>
              </div>
              <a className="problem-source" href={questionSourceUrl(scenario)} target="_blank" rel="noreferrer">
                Original problem inspiration <ExternalLink size={10} />
              </a>
            </div>
          ) : (
            <div className={`coach-note ${showCoach ? "" : "hidden"}`}>
              <Lightbulb size={16} />
              <p><strong>Room note</strong>{assessment.nextProbe}</p>
              <button onClick={() => setShowCoach(false)} aria-label="Dismiss coaching note" type="button"><X size={14} /></button>
            </div>
          )}

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
              <button onClick={() => addMessage("architect", activeNudge)} type="button"><CircleHelp size={15} /> Nudge me</button>
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
            <h2 id="debrief-title">Your reasoning profile—not a reference-answer match.</h2>
            <div className="score-row">
              <div className="score-ring" style={{ "--score": `${assessment.overall * 3.6}deg` } as React.CSSProperties}><span>{assessment.overall}</span><small>/100</small></div>
              <p>
                {sessionMode === "guided"
                  ? <>You reached <strong>{frameworkStage.label}</strong> in the delivery framework and drew <strong>{signals.shapes} components</strong> with <strong>{signals.connections} connections</strong>.</>
                  : <>You explored <strong>{covered.length} of 7</strong> design dimensions and drew <strong>{signals.shapes} components</strong> with <strong>{signals.connections} connections</strong>.</>
                } Novel designs are welcome; scores reflect the evidence and trade-offs you explained, not similarity to any published solution.
              </p>
            </div>
            <div className="quality-score-list" aria-label="Core evaluation patterns">
              {assessment.qualities.map((quality) => (
                <div className="quality-score" key={quality.id} title={quality.feedback}>
                  <span>{quality.label}</span><div><i style={{ width: `${quality.score}%` }} /></div><strong>{quality.score}</strong>
                </div>
              ))}
            </div>
            <h3>Architectural choices evaluated</h3>
            <div className="choice-table">
              {assessment.choices.map((choice) => (
                <div className="choice-row" key={choice.id}>
                  <strong>{choice.category}</strong>
                  <span><b>{choice.focus}</b>{choice.goal}</span>
                  <small>{choice.evidence}</small>
                </div>
              ))}
            </div>
            <div className="debrief-grid">
              <div><Check size={17} /><span><strong>Evidence seen</strong>{assessment.choices.filter((choice) => choice.evidence !== "Not discussed yet").length} of 3 architectural-choice categories were discussed.</span></div>
              <div><Lightbulb size={17} /><span><strong>Next probe</strong>{assessment.nextProbe}</span></div>
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
      <span><strong>InterviewRoom</strong>{!compact && <small>Technical interview studio</small>}</span>
    </div>
  );
}
