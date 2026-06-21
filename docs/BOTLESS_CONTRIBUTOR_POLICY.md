# Botless Contributor Policy

## Principle

This project does not accept automated commits, auto-merges, or bot-generated pull requests that bypass human review.

## What is prohibited

- Auto-merge bots
- Dependabot auto-commits (PRs are OK, but must be reviewed)
- AI-generated code submissions without human verification
- Any tool that writes to the repository without explicit maintainer approval

## What is allowed

- Dependabot opening PRs for security updates
- CI running checks (read-only permissions)
- Human-reviewed and human-merged contributions

## Why

The AxonOS Boundary Run project deals with consent, privacy, and safety-critical concepts. Automated changes could introduce subtle bugs in the consent state machine or proof generation logic that automated tests might not catch.

## Enforcement

CI workflows run with `contents: read` only. No workflow has write permissions. The `deploy_pages_branch.sh` script is run manually by the maintainer, not by a bot.

## Attribution

Created by Denis Yermakou, Founder & CEO of AxonOS.