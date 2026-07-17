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
- Automatic desktop discovery for installed Codex, Claude Code, and Antigravity CLI agents
- Session-only API-key fallback for OpenAI, Claude, Gemini, and Antigravity APIs
- Adaptive requirement answers and architecture follow-ups
- Embedded Excalidraw canvas with label/topology-aware review
- Coverage tracking and an end-of-session debrief
- Responsive interview workspace for desktop and mobile

The desktop app can use an installed Codex, Claude Code, or Antigravity CLI
directly through that tool's existing account sign-in, so no API key is needed.
Local agents run non-interactively from a neutral temporary directory with
restricted tool access. API-key mode remains available as a fallback and is the
only provider mode exposed by browser, Node.js, and Docker deployments. Keys
remain in the active browser tab, pass only through the same-origin interviewer
endpoint, and are never persisted. InterviewLab has no server-owned provider
credential or shared AI budget.

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

## Desktop executables

InterviewLab can run as a self-contained desktop application. The executable
starts its own server on a random loopback-only port, so no Docker, Node.js
installation, hosted backend, or inbound network access is required. Internet
access is still required when you ask an external AI provider for a response.
On startup, the desktop build checks the executable search path and standard
per-user install directories for `codex`, `claude`, and `agy`. If one is found,
InterviewLab selects it automatically and uses the CLI's existing sign-in and
subscription allowances. The app never reads or copies the CLI's credentials.

GitHub release builds include:

| Operating system | Architectures | Downloads |
| --- | --- | --- |
| Windows | x64 | Installer `.exe` and portable `.exe` |
| macOS | Apple Silicon and Intel | `.dmg` and `.zip` |
| Linux | x64 | Portable `.AppImage` and Debian/Ubuntu `.deb` |

Download a published build from the repository's **Releases** page. Community
builds are currently unsigned, so Windows SmartScreen or macOS Gatekeeper may
show an unknown-publisher warning. Only use artifacts published by this
repository. Signing can be added later without changing the runtime design.

Installed builds include a **Check for updates** control. InterviewLab checks
the repository's GitHub Releases, downloads a newer installer in the
background, and offers to restart when it is ready. The Windows portable build
opens the latest release instead because a running portable executable cannot
replace itself safely. Automatic installation on macOS requires releases to be
code-signed and notarized; unsigned development releases still need to be
downloaded manually.

To build an executable for the operating system you are currently using:

```bash
npm ci
npm run desktop:dist
```

Artifacts are written to `dist-desktop`. Run `npm run desktop:run` to build and
launch the desktop app locally without creating an installer. The release
workflow builds every supported operating system on its native runner; pushing
a version tag such as `v0.1.0` synchronizes the app version and publishes all
installers plus their update metadata to a GitHub release.

## Self-host with Docker

Docker is the recommended portable deployment path. Host CLI agents are not
exposed inside the container. No server-side AI-provider keys are required
because candidates supply external-provider keys in their active browser
session.

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
