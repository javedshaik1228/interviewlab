# Security policy

## Reporting a vulnerability

Please do not disclose security vulnerabilities in a public issue. Use GitHub's
private vulnerability reporting for this repository instead. Include the
affected version, reproduction steps, impact, and any suggested mitigation.

## Supported version

Security fixes target the latest revision of the default branch. This project
does not currently maintain older release branches.

## Deployment notes

InterviewLab accepts session-only third-party API keys through the interviewer
endpoint. Public deployments must use HTTPS and must not log request bodies for
that endpoint. Operators are responsible for access controls, updates, backups,
and compliance appropriate to their environment.
