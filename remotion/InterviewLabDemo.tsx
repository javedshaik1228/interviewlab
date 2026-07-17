import type { CSSProperties, ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";

const colors = {
  cream: "#f5f1e8",
  paper: "#fffdf7",
  ink: "#12201e",
  muted: "#68736e",
  line: "#d9d6cc",
  coral: "#ff5638",
  coralDark: "#d63e27",
  mint: "#bfe8d4",
  yellow: "#ffd66b",
  dark: "#101c1b",
};

const sans = "Arial, Helvetica, sans-serif";
const serif = "Georgia, 'Times New Roman', serif";
const mono = "'Courier New', Courier, monospace";

type ProductDemoProps = {
  repositoryUrl: string;
};

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const smooth = Easing.bezier(0.16, 1, 0.3, 1);

function SceneShell({
  children,
  duration,
  dark = false,
}: {
  children: ReactNode;
  duration: number;
  dark?: boolean;
}) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? colors.dark : colors.cream,
        color: dark ? colors.paper : colors.ink,
        fontFamily: sans,
        opacity: interpolate(frame, [0, 15, duration - 20, duration], [0, 1, 1, 0], {
          ...clamp,
          easing: smooth,
        }),
        overflow: "hidden",
      }}
    >
      <GridBackground dark={dark} />
      {children}
    </AbsoluteFill>
  );
}

function GridBackground({ dark = false }: { dark?: boolean }) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${dark ? "rgba(191,232,212,0.055)" : "rgba(18,32,30,0.055)"} 1px, transparent 1px), linear-gradient(90deg, ${dark ? "rgba(191,232,212,0.055)" : "rgba(18,32,30,0.055)"} 1px, transparent 1px)`,
        backgroundPosition: `${interpolate(frame, [0, 300], [0, 36], clamp)}px ${interpolate(frame, [0, 300], [0, 22], clamp)}px`,
        backgroundSize: "72px 72px",
      }}
    />
  );
}

function BrandMark({ size = 86, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <div
      style={{
        alignItems: "flex-end",
        background: inverse ? colors.paper : colors.ink,
        borderRadius: size * 0.22,
        display: "flex",
        gap: size * 0.09,
        height: size,
        justifyContent: "center",
        paddingBottom: size * 0.22,
        width: size,
      }}
    >
      {[0.32, 0.58, 0.43].map((height, index) => (
        <div
          key={height}
          style={{
            background: index === 1 ? colors.coral : inverse ? colors.ink : colors.paper,
            borderRadius: size * 0.035,
            height: size * height,
            width: size * 0.115,
          }}
        />
      ))}
    </div>
  );
}

function Brand({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <div style={{ alignItems: "center", display: "flex", gap: compact ? 18 : 24 }}>
      <BrandMark inverse={inverse} size={compact ? 58 : 78} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: serif, fontSize: compact ? 38 : 54, fontWeight: 700, letterSpacing: -2 }}>
          InterviewLab
        </div>
        {!compact && (
          <div style={{ color: inverse ? colors.mint : colors.muted, fontSize: 18, letterSpacing: 3.5, textTransform: "uppercase" }}>
            Technical interview practice studio
          </div>
        )}
      </div>
    </div>
  );
}

function Kicker({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div
      style={{
        alignItems: "center",
        color: dark ? colors.mint : colors.coralDark,
        display: "flex",
        fontSize: 24,
        fontWeight: 700,
        gap: 13,
        letterSpacing: 4,
        textTransform: "uppercase",
      }}
    >
      <span style={{ background: dark ? colors.mint : colors.coral, borderRadius: 99, height: 11, width: 11 }} />
      {children}
    </div>
  );
}

function BrowserWindow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: colors.paper,
        border: `2px solid ${colors.ink}`,
        borderRadius: 26,
        boxShadow: "0 28px 70px rgba(18,32,30,0.15)",
        color: colors.ink,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "#eeeae1",
          borderBottom: `2px solid ${colors.line}`,
          display: "flex",
          gap: 11,
          height: 58,
          padding: "0 23px",
        }}
      >
        {[colors.coral, colors.yellow, colors.mint].map((color) => (
          <span key={color} style={{ background: color, border: `1px solid ${colors.ink}`, borderRadius: 99, height: 15, width: 15 }} />
        ))}
        <div
          style={{
            background: colors.paper,
            border: `1px solid ${colors.line}`,
            borderRadius: 9,
            color: colors.muted,
            fontSize: 18,
            marginLeft: 18,
            padding: "7px 20px",
            width: 590,
          }}
        >
          InterviewLab · local interview room
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

function Pill({ children, active = false, dark = false }: { children: ReactNode; active?: boolean; dark?: boolean }) {
  return (
    <div
      style={{
        alignItems: "center",
        background: active ? colors.ink : dark ? "rgba(255,255,255,0.07)" : colors.paper,
        border: `2px solid ${active ? colors.ink : dark ? "rgba(191,232,212,0.3)" : colors.line}`,
        borderRadius: 99,
        color: active ? colors.paper : dark ? colors.paper : colors.ink,
        display: "flex",
        fontSize: 23,
        fontWeight: 700,
        flexShrink: 0,
        gap: 10,
        justifyContent: "center",
        padding: "13px 24px",
        whiteSpace: "nowrap",
      }}
    >
      {active && <span style={{ background: colors.mint, borderRadius: 99, height: 9, width: 9 }} />}
      {children}
    </div>
  );
}

function HeroScene() {
  const frame = useCurrentFrame();
  return (
    <SceneShell duration={150}>
      <AbsoluteFill style={{ padding: "88px 110px" }}>
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "space-between",
            opacity: interpolate(frame, [8, 28], [0, 1], { ...clamp, easing: smooth }),
            translate: `0 ${interpolate(frame, [8, 28], [28, 0], { ...clamp, easing: smooth })}px`,
          }}
        >
          <Brand compact />
          <Pill>Open source · local first</Pill>
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            maxWidth: 1480,
            paddingBottom: 70,
          }}
        >
          <Kicker>Meet your practice room</Kicker>
          <div
            style={{
              fontFamily: serif,
              fontSize: 134,
              fontWeight: 700,
              letterSpacing: -7,
              lineHeight: 0.94,
              marginTop: 34,
              opacity: interpolate(frame, [18, 50], [0, 1], { ...clamp, easing: smooth }),
              translate: `${interpolate(frame, [18, 50], [-70, 0], { ...clamp, easing: smooth })}px 0`,
            }}
          >
            Practice the interview.
            <br />
            <span style={{ color: colors.coral }}>Not just the answer.</span>
          </div>
          <div
            style={{
              color: colors.muted,
              fontSize: 43,
              lineHeight: 1.35,
              marginTop: 36,
              maxWidth: 1080,
              opacity: interpolate(frame, [44, 70], [0, 1], { ...clamp, easing: smooth }),
            }}
          >
            System design and coding rounds with an AI interviewer that follows your reasoning.
          </div>
        </div>
        <div
          style={{
            background: colors.ink,
            bottom: 0,
            height: 14,
            left: 0,
            position: "absolute",
            scale: `${interpolate(frame, [12, 105], [0, 1], { ...clamp, easing: smooth })} 1`,
            transformOrigin: "left center",
            width: "100%",
          }}
        />
      </AbsoluteFill>
    </SceneShell>
  );
}

function OverviewScene() {
  const frame = useCurrentFrame();
  return (
    <SceneShell duration={180}>
      <AbsoluteFill style={{ alignItems: "center", display: "flex", flexDirection: "row", padding: "86px 100px" }}>
        <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, gap: 26, width: 570 }}>
          <Kicker>One studio</Kicker>
          <div style={{ fontFamily: serif, fontSize: 82, fontWeight: 700, letterSpacing: -4, lineHeight: 0.98 }}>
            Every technical round, in one place.
          </div>
          <div style={{ color: colors.muted, fontSize: 36, lineHeight: 1.4 }}>
            Discuss trade-offs. Draw the architecture. Write the code. Get feedback that sees the whole session.
          </div>
        </div>
        <div
          style={{
            flex: 1,
            marginLeft: 62,
            opacity: interpolate(frame, [12, 40], [0, 1], { ...clamp, easing: smooth }),
            rotate: `${interpolate(frame, [12, 40], [2.4, 0], { ...clamp, easing: smooth })}deg`,
            scale: interpolate(frame, [12, 40], [0.92, 1], { ...clamp, easing: smooth }),
            translate: `${interpolate(frame, [12, 40], [90, 0], { ...clamp, easing: smooth })}px 0`,
          }}
        >
          <div style={{ background: colors.paper, border: `2px solid ${colors.ink}`, borderRadius: 28, boxShadow: "0 30px 80px rgba(18,32,30,0.18)", overflow: "hidden", padding: 12 }}>
            <Img
              src={staticFile("og-interviewlab.png")}
              style={{ borderRadius: 18, display: "block", height: 525, objectFit: "cover", width: 1000 }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
}

function SetupScene() {
  const frame = useCurrentFrame();
  const providerNames = ["Codex", "Claude Code", "Antigravity"];
  return (
    <SceneShell duration={180}>
      <AbsoluteFill style={{ padding: "78px 100px" }}>
        <div style={{ alignItems: "flex-end", display: "flex", justifyContent: "space-between" }}>
          <div>
            <Kicker>Ready in seconds</Kicker>
            <div style={{ fontFamily: serif, fontSize: 78, fontWeight: 700, letterSpacing: -3, marginTop: 19 }}>
              Choose your round. Pick your interviewer.
            </div>
          </div>
          <Pill active>Step 3 of 3</Pill>
        </div>
        <BrowserWindow
          style={{
            height: 720,
            marginTop: 38,
            opacity: interpolate(frame, [10, 34], [0, 1], { ...clamp, easing: smooth }),
            scale: interpolate(frame, [10, 34], [0.95, 1], { ...clamp, easing: smooth }),
            translate: `0 ${interpolate(frame, [10, 34], [50, 0], { ...clamp, easing: smooth })}px`,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "0.82fr 1.18fr", height: "100%" }}>
            <div style={{ borderRight: `2px solid ${colors.line}`, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px" }}>
              <div>
                <div style={{ color: colors.coralDark, fontSize: 20, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Interview setup</div>
                <div style={{ fontFamily: serif, fontSize: 62, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.02, marginTop: 25 }}>Set up your coding round.</div>
                <div style={{ color: colors.muted, fontSize: 29, lineHeight: 1.42, marginTop: 20 }}>Choose a language, then receive a level-calibrated problem.</div>
              </div>
              <div style={{ alignItems: "center", background: "#f0eefc", border: "2px solid #cbc5ef", borderRadius: 18, display: "flex", gap: 18, padding: 25 }}>
                <div style={{ color: "#5542ad", fontFamily: mono, fontSize: 31 }}>&lt;/&gt;</div>
                <div>
                  <div style={{ fontSize: 23, fontWeight: 700 }}>Random challenge from NeetCode 150</div>
                  <div style={{ color: colors.muted, fontSize: 19, marginTop: 6 }}>Difficulty calibrated to your level</div>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 32, padding: "45px 60px" }}>
              <div style={{ display: "grid", gap: 13 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>Preferred coding language</div>
                <div style={{ alignItems: "center", border: `2px solid ${colors.line}`, borderRadius: 12, display: "flex", fontFamily: mono, fontSize: 25, height: 58, justifyContent: "space-between", padding: "0 20px" }}><span>C++</span><span>⌄</span></div>
              </div>
              <div style={{ borderTop: `2px solid ${colors.line}`, paddingTop: 28 }}>
                <div style={{ color: colors.muted, fontSize: 19, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Choose your interviewer</div>
                <div style={{ display: "flex", gap: 14, marginTop: 17 }}>
                  {providerNames.map((provider, index) => (
                    <div
                      key={provider}
                      style={{
                        opacity: interpolate(frame, [42 + index * 12, 61 + index * 12], [0, 1], { ...clamp, easing: smooth }),
                        scale: interpolate(frame, [42 + index * 12, 61 + index * 12], [0.8, 1], { ...clamp, easing: smooth }),
                      }}
                    >
                      <Pill active={index === 0}>{provider}</Pill>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: "#f3f1ea", border: `2px solid ${colors.line}`, borderRadius: 17, padding: 24 }}>
                <div style={{ alignItems: "center", display: "flex", fontSize: 22, fontWeight: 700, gap: 12 }}><span>✓</span> Existing local sign-in detected</div>
                <div style={{ color: colors.muted, fontSize: 19, lineHeight: 1.4, marginTop: 9 }}>InterviewLab uses your installed agent directly. No API key is copied or stored.</div>
              </div>
              <div style={{ alignItems: "center", background: colors.ink, borderRadius: 14, color: colors.paper, display: "flex", fontSize: 27, fontWeight: 700, height: 70, justifyContent: "center", marginTop: "auto" }}>Enter the coding room&nbsp;&nbsp; →</div>
            </div>
          </div>
        </BrowserWindow>
      </AbsoluteFill>
    </SceneShell>
  );
}

function SystemDesignScene() {
  const frame = useCurrentFrame();
  const drawProgress = interpolate(frame, [42, 118], [1, 0], { ...clamp, easing: smooth });
  const nodeStyle: CSSProperties = {
    alignItems: "center",
    background: colors.paper,
    border: `2px solid ${colors.ink}`,
    borderRadius: 14,
    display: "flex",
    fontSize: 21,
    fontWeight: 700,
    height: 76,
    justifyContent: "center",
    position: "absolute",
    textAlign: "center",
    width: 164,
  };
  return (
    <SceneShell duration={240} dark>
      <AbsoluteFill style={{ padding: "74px 92px" }}>
        <div style={{ alignItems: "flex-end", display: "flex", justifyContent: "space-between" }}>
          <div>
            <Kicker dark>System design</Kicker>
            <div style={{ fontFamily: serif, fontSize: 78, fontWeight: 700, letterSpacing: -3, marginTop: 18 }}>A real interviewer, in the loop.</div>
          </div>
          <div style={{ color: colors.mint, fontFamily: mono, fontSize: 25 }}>07 / 08 areas covered</div>
        </div>
        <BrowserWindow style={{ height: 742, marginTop: 36 }}>
          <div style={{ display: "grid", gridTemplateColumns: "520px 1fr", height: "100%" }}>
            <div style={{ background: "#f2efe7", borderRight: `2px solid ${colors.line}`, display: "flex", flexDirection: "column", padding: 34 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
                <div style={{ alignItems: "center", background: colors.ink, borderRadius: 99, color: colors.paper, display: "flex", fontSize: 20, fontWeight: 700, height: 54, justifyContent: "center", width: 54 }}>SA</div>
                <div><div style={{ fontSize: 24, fontWeight: 700 }}>System Design Interviewer</div><div style={{ color: colors.muted, fontSize: 18, marginTop: 4 }}>Senior architecture round · live</div></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 32 }}>
                <div style={{ background: colors.paper, border: `2px solid ${colors.line}`, borderRadius: "8px 20px 20px 20px", fontSize: 23, lineHeight: 1.45, padding: 22 }}>Your reads just doubled. What breaks first—and how would you see it coming?</div>
                <div
                  style={{
                    alignSelf: "flex-end",
                    background: colors.ink,
                    borderRadius: "20px 8px 20px 20px",
                    color: colors.paper,
                    fontSize: 22,
                    lineHeight: 1.45,
                    opacity: interpolate(frame, [55, 79], [0, 1], { ...clamp, easing: smooth }),
                    padding: 22,
                    translate: `${interpolate(frame, [55, 79], [35, 0], { ...clamp, easing: smooth })}px 0`,
                    width: 390,
                  }}
                >
                  I’d isolate read traffic, add replicas, and watch replica lag plus cache hit rate.
                </div>
              </div>
              <div style={{ marginTop: "auto" }}>
                <div style={{ color: colors.muted, display: "flex", fontSize: 18, justifyContent: "space-between" }}><span>Coverage</span><span>87%</span></div>
                <div style={{ background: "#d8d4ca", borderRadius: 99, height: 11, marginTop: 10, overflow: "hidden" }}><div style={{ background: colors.coral, borderRadius: 99, height: "100%", scale: `${interpolate(frame, [22, 120], [0.18, 0.87], { ...clamp, easing: smooth })} 1`, transformOrigin: "left center" }} /></div>
              </div>
            </div>
            <div style={{ background: "#fbfaf5", padding: 30 }}>
              <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                <div><div style={{ fontFamily: serif, fontSize: 32, fontWeight: 700 }}>Architecture canvas</div><div style={{ color: colors.muted, fontSize: 17, marginTop: 4 }}>Excalidraw · autosaved locally</div></div>
                <Pill>Review architecture</Pill>
              </div>
              <div style={{ backgroundImage: "radial-gradient(rgba(18,32,30,0.13) 1.5px, transparent 1.5px)", backgroundSize: "23px 23px", border: `2px solid ${colors.line}`, borderRadius: 18, height: 520, marginTop: 24, overflow: "hidden", position: "relative" }}>
                <svg height="520" style={{ left: 0, position: "absolute", top: 0 }} viewBox="0 0 1000 520" width="100%">
                  <path d="M190 126 H335" fill="none" pathLength="1" stroke={colors.ink} strokeDasharray="1" strokeDashoffset={drawProgress} strokeWidth="3" />
                  <path d="M500 126 H650" fill="none" pathLength="1" stroke={colors.ink} strokeDasharray="1" strokeDashoffset={drawProgress} strokeWidth="3" />
                  <path d="M418 164 V280 H286 V330" fill="none" pathLength="1" stroke={colors.coral} strokeDasharray="1" strokeDashoffset={drawProgress} strokeWidth="4" />
                  <path d="M418 280 H602 V330" fill="none" pathLength="1" stroke={colors.coral} strokeDasharray="1" strokeDashoffset={drawProgress} strokeWidth="4" />
                  <path d="M815 164 V368 H730" fill="none" pathLength="1" stroke={colors.ink} strokeDasharray="1" strokeDashoffset={drawProgress} strokeWidth="3" />
                </svg>
                <div style={{ ...nodeStyle, background: colors.mint, left: 26, top: 88 }}>Clients</div>
                <div style={{ ...nodeStyle, left: 335, top: 88 }}>API Gateway</div>
                <div style={{ ...nodeStyle, background: colors.mint, left: 650, top: 88 }}>App Service</div>
                <div style={{ ...nodeStyle, background: "#fff1c8", left: 202, top: 330 }}>Redis Cache</div>
                <div style={{ ...nodeStyle, left: 520, top: 330 }}>Read Replicas</div>
                <div style={{ ...nodeStyle, background: "#ffe4dc", left: 830, top: 330 }}>Metrics</div>
                <div
                  style={{
                    background: colors.ink,
                    borderRadius: 13,
                    bottom: 20,
                    color: colors.paper,
                    fontSize: 18,
                    opacity: interpolate(frame, [118, 146], [0, 1], { ...clamp, easing: smooth }),
                    padding: "13px 18px",
                    position: "absolute",
                    right: 20,
                    translate: `0 ${interpolate(frame, [118, 146], [20, 0], { ...clamp, easing: smooth })}px`,
                  }}
                >
                  ✓ Strong trade-off explanation
                </div>
              </div>
            </div>
          </div>
        </BrowserWindow>
      </AbsoluteFill>
    </SceneShell>
  );
}

function CodingScene() {
  const frame = useCurrentFrame();
  const codeLines = [
    ["def ", "length_of_longest_substring", "(s):"],
    ["  seen = {}", "", ""],
    ["  left = best = 0", "", ""],
    ["  for right, char in enumerate(s):", "", ""],
    ["    if char in seen:", "", ""],
    ["      left = max(left, seen[char] + 1)", "", ""],
    ["    seen[char] = right", "", ""],
    ["    best = max(best, right - left + 1)", "", ""],
    ["  return best", "", ""],
  ];
  return (
    <SceneShell duration={210}>
      <AbsoluteFill style={{ padding: "74px 92px" }}>
        <div style={{ alignItems: "flex-end", display: "flex", justifyContent: "space-between" }}>
          <div>
            <Kicker>Coding rounds</Kicker>
            <div style={{ fontFamily: serif, fontSize: 78, fontWeight: 700, letterSpacing: -3, marginTop: 18 }}>The follow-up is part of the test.</div>
          </div>
          <Pill>NeetCode 150 · Python</Pill>
        </div>
        <BrowserWindow style={{ height: 742, marginTop: 36 }}>
          <div style={{ display: "grid", gridTemplateColumns: "450px 1fr 420px", height: "100%" }}>
            <div style={{ borderRight: `2px solid ${colors.line}`, padding: 32 }}>
              <div style={{ color: colors.coralDark, fontSize: 18, fontWeight: 700, letterSpacing: 2.2, textTransform: "uppercase" }}>Medium · Arrays & hashing</div>
              <div style={{ fontFamily: serif, fontSize: 38, fontWeight: 700, lineHeight: 1.12, marginTop: 19 }}>Longest Substring Without Repeating Characters</div>
              <div style={{ color: colors.muted, fontSize: 20, lineHeight: 1.48, marginTop: 24 }}>Given a string, find the length of the longest substring without repeating characters.</div>
              <div style={{ background: "#f2efe7", borderRadius: 14, fontFamily: mono, fontSize: 19, lineHeight: 1.55, marginTop: 27, padding: 20 }}>Input: s = &quot;abcabcbb&quot;<br />Output: 3</div>
              <div style={{ borderTop: `2px solid ${colors.line}`, color: colors.muted, fontSize: 18, lineHeight: 1.45, marginTop: 27, paddingTop: 22 }}>Capture your approach and complexity notes as you work.</div>
            </div>
            <div style={{ background: colors.dark, color: "#d9eee4", fontFamily: mono, padding: "28px 34px" }}>
              <div style={{ color: "#81938b", display: "flex", fontSize: 17, justifyContent: "space-between" }}><span>solution.py</span><span>Python 3</span></div>
              <div style={{ fontSize: 21, lineHeight: 2, marginTop: 24 }}>
                {codeLines.map((parts, index) => (
                  <div
                    key={parts[0]}
                    style={{
                      opacity: interpolate(frame, [20 + index * 6, 32 + index * 6], [0, 1], clamp),
                      translate: `${interpolate(frame, [20 + index * 6, 32 + index * 6], [-14, 0], clamp)}px 0`,
                      whiteSpace: "pre",
                    }}
                  >
                    <span style={{ color: "#71837b", display: "inline-block", width: 38 }}>{index + 1}</span>
                    <span style={{ color: index === 0 ? "#ff7c61" : index === 3 || index === 4 ? "#ffd66b" : "#c5ead9" }}>{parts[0]}</span>
                    <span style={{ color: "#75d8ff" }}>{parts[1]}</span>
                    <span>{parts[2]}</span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  alignItems: "center",
                  background: "rgba(191,232,212,0.1)",
                  border: "1px solid rgba(191,232,212,0.25)",
                  borderRadius: 12,
                  color: colors.mint,
                  display: "flex",
                  fontFamily: sans,
                  fontSize: 20,
                  fontWeight: 700,
                  gap: 12,
                  marginTop: 25,
                  opacity: interpolate(frame, [92, 116], [0, 1], { ...clamp, easing: smooth }),
                  padding: "16px 20px",
                }}
              >
                <span>✓</span> 12 / 12 tests passed <span style={{ color: "#81938b", fontWeight: 400, marginLeft: "auto" }}>64 ms</span>
              </div>
            </div>
            <div style={{ background: "#f2efe7", borderLeft: `2px solid ${colors.line}`, display: "flex", flexDirection: "column", padding: 28 }}>
              <div style={{ alignItems: "center", display: "flex", gap: 13 }}><div style={{ alignItems: "center", background: colors.ink, borderRadius: 99, color: colors.paper, display: "flex", fontSize: 18, height: 46, justifyContent: "center", width: 46 }}>AI</div><div><div style={{ fontSize: 22, fontWeight: 700 }}>Coding interviewer</div><div style={{ color: colors.muted, fontSize: 16 }}>Follow-up mode</div></div></div>
              <div
                style={{
                  background: colors.paper,
                  border: `2px solid ${colors.line}`,
                  borderRadius: "8px 18px 18px 18px",
                  fontSize: 22,
                  lineHeight: 1.45,
                  marginTop: 30,
                  opacity: interpolate(frame, [112, 137], [0, 1], { ...clamp, easing: smooth }),
                  padding: 20,
                  translate: `0 ${interpolate(frame, [112, 137], [25, 0], { ...clamp, easing: smooth })}px`,
                }}
              >
                What invariant makes your sliding window correct?
              </div>
              <div style={{ color: colors.muted, fontSize: 18, lineHeight: 1.45, marginTop: "auto" }}>InterviewLab evaluates the explanation, not only the test result.</div>
              <div style={{ alignItems: "center", background: colors.ink, borderRadius: 12, color: colors.paper, display: "flex", fontSize: 20, fontWeight: 700, height: 56, justifyContent: "center", marginTop: 18 }}>Submit solution</div>
            </div>
          </div>
        </BrowserWindow>
      </AbsoluteFill>
    </SceneShell>
  );
}

function AgentScene() {
  const frame = useCurrentFrame();
  const agents = [
    { name: "Codex", detail: "Detected", color: colors.mint, mark: "C" },
    { name: "Claude Code", detail: "Ready", color: colors.yellow, mark: "✦" },
    { name: "Antigravity", detail: "Installed", color: "#d9d1ff", mark: "A" },
  ];
  return (
    <SceneShell duration={120} dark>
      <AbsoluteFill style={{ alignItems: "center", display: "flex", flexDirection: "column", justifyContent: "center", padding: "70px 100px" }}>
        <Kicker dark>Bring your own agent</Kicker>
        <div style={{ fontFamily: serif, fontSize: 90, fontWeight: 700, letterSpacing: -4, marginTop: 22, textAlign: "center" }}>No API key. Use the tools already on your computer.</div>
        <div style={{ display: "flex", gap: 28, marginTop: 55 }}>
          {agents.map((agent, index) => (
            <div
              key={agent.name}
              style={{
                alignItems: "center",
                background: "rgba(255,255,255,0.06)",
                border: "2px solid rgba(191,232,212,0.25)",
                borderRadius: 22,
                display: "flex",
                gap: 20,
                opacity: interpolate(frame, [14 + index * 10, 34 + index * 10], [0, 1], { ...clamp, easing: smooth }),
                padding: "26px 34px",
                scale: interpolate(frame, [14 + index * 10, 34 + index * 10], [0.86, 1], { ...clamp, easing: smooth }),
                width: 410,
              }}
            >
              <div style={{ alignItems: "center", background: agent.color, borderRadius: 15, color: colors.ink, display: "flex", fontFamily: serif, fontSize: 32, fontWeight: 700, height: 66, justifyContent: "center", width: 66 }}>{agent.mark}</div>
              <div><div style={{ fontSize: 28, fontWeight: 700 }}>{agent.name}</div><div style={{ color: colors.mint, fontSize: 19, marginTop: 5 }}>● {agent.detail}</div></div>
            </div>
          ))}
        </div>
        <div style={{ color: "#93a69e", fontSize: 28, marginTop: 42 }}>Your existing sign-in stays with the installed CLI.</div>
        <div style={{ display: "flex", gap: 16, marginTop: 26 }}><Pill dark>Windows</Pill><Pill dark>macOS</Pill><Pill dark>Linux</Pill><Pill dark>Check for updates</Pill></div>
      </AbsoluteFill>
    </SceneShell>
  );
}

function FinalScene({ repositoryUrl }: ProductDemoProps) {
  const frame = useCurrentFrame();
  return (
    <SceneShell duration={120}>
      <AbsoluteFill style={{ alignItems: "center", display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 100px", textAlign: "center" }}>
        <div style={{ opacity: interpolate(frame, [8, 28], [0, 1], { ...clamp, easing: smooth }), scale: interpolate(frame, [8, 28], [0.75, 1], { ...clamp, easing: smooth }) }}><BrandMark size={112} /></div>
        <div style={{ fontFamily: serif, fontSize: 104, fontWeight: 700, letterSpacing: -5, lineHeight: 1, marginTop: 32 }}>Walk into your next interview ready.</div>
        <div style={{ color: colors.muted, fontSize: 36, marginTop: 25 }}>Practice the conversation. Build the system. Explain the code.</div>
        <div
          style={{
            alignItems: "center",
            background: colors.ink,
            borderRadius: 18,
            color: colors.paper,
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            gap: 18,
            marginTop: 42,
            opacity: interpolate(frame, [34, 55], [0, 1], { ...clamp, easing: smooth }),
            padding: "22px 34px",
            translate: `0 ${interpolate(frame, [34, 55], [24, 0], { ...clamp, easing: smooth })}px`,
          }}
        >
          Download InterviewLab <span style={{ color: colors.mint }}>→</span>
        </div>
        <div style={{ color: colors.coralDark, fontFamily: mono, fontSize: 25, marginTop: 26 }}>{repositoryUrl}</div>
        <div style={{ bottom: 35, color: colors.muted, fontSize: 18, letterSpacing: 2.5, position: "absolute", textTransform: "uppercase" }}>Open source · local first · built for deliberate practice</div>
      </AbsoluteFill>
    </SceneShell>
  );
}

export function InterviewLabDemo({ repositoryUrl }: ProductDemoProps) {
  return (
    <AbsoluteFill style={{ background: colors.cream }}>
      <Sequence durationInFrames={150}><HeroScene /></Sequence>
      <Sequence from={150} durationInFrames={180}><OverviewScene /></Sequence>
      <Sequence from={330} durationInFrames={180}><SetupScene /></Sequence>
      <Sequence from={510} durationInFrames={240}><SystemDesignScene /></Sequence>
      <Sequence from={750} durationInFrames={210}><CodingScene /></Sequence>
      <Sequence from={960} durationInFrames={120}><AgentScene /></Sequence>
      <Sequence from={1080} durationInFrames={120}><FinalScene repositoryUrl={repositoryUrl} /></Sequence>
    </AbsoluteFill>
  );
}
