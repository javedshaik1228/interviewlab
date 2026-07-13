# InterviewLab

InterviewLab is a discussion-first technical interview practice studio. Candidates
choose their target level and practice either system design or NeetCode 150
coding rounds while an adaptive interviewer challenges their reasoning.

## What is included

- Junior, mid-level, and senior architect calibration
- Guided learning and realistic mock-interview modes
- A curated catalog of system-design prompts
- NeetCode 150 coding rounds with embedded prompts and submission notes
- Session-only provider choice for OpenAI, Claude, Gemini, and Antigravity APIs
- Adaptive requirement answers and architecture follow-ups
- Embedded Excalidraw canvas with label/topology-aware review
- Coverage tracking and an end-of-session debrief
- Responsive interview workspace for desktop and mobile

External providers use a bring-your-own-key flow. Keys remain in the active
browser tab, are sent only through the same-origin interviewer endpoint, and
are not persisted by the application. The built-in interviewer requires no key
and is used automatically if an external provider fails.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Run the full validation suite with:

```bash
npm test
npm run lint
```
