# InterviewLab

[![CI](https://github.com/javedshaik1228/interviewlab/actions/workflows/ci.yml/badge.svg)](https://github.com/javedshaik1228/interviewlab/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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
git clone https://github.com/javedshaik1228/interviewlab.git
cd interviewlab
npm ci
npm run dev
```

Development and production both use the standard Next.js runtime. Production
builds use Next.js standalone output for portable deployment.

## Self-host with Docker

Docker is the recommended portable deployment path. No server-side AI-provider
keys are required because candidates supply external-provider keys in their
active browser session.

```bash
cp .env.example .env
docker compose up -d --build
```

InterviewLab will be available at `http://localhost:3000`. Before deploying
behind a public domain, set `SITE_URL` in `.env` to the complete public origin,
for example `https://interview.example.com`. Set `PORT` to change the host port.

The container exposes `/api/health` for health checks and runs as a non-root
user. Its network must allow outbound HTTPS requests to any AI providers users
select. Because session API keys pass through `/api/interviewer`, terminate TLS
at the application or reverse proxy and avoid request-body logging there.

## Self-host with Node.js

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run build
npm start
```

Set `SITE_URL`, `PORT`, and `HOSTNAME` in the process environment as needed.
The production build does not download fonts and does not depend on Sites or
Cloudflare at runtime.

Run the full validation suite with:

```bash
npm test
npm run lint
```

## Contributing

Issues and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md)
before proposing a change, and report vulnerabilities according to
[SECURITY.md](SECURITY.md).

## Third-party services and content

InterviewLab is an independent project and is not affiliated with or endorsed
by NeetCode, Hello Interview, Excalidraw, OpenAI, Anthropic, Google, or their
respective owners. Third-party names and links identify compatible services or
learning resources; their content, trademarks, and terms remain their owners'.

## License

InterviewLab's source code is available under the [MIT License](LICENSE).
