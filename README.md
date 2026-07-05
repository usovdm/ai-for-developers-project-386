### Hexlet tests and linter status:
[![Actions Status](https://github.com/usovdm/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/usovdm/ai-for-developers-project-386/actions)

## Commit Format

Use Conventional Commits for all commits, including commits created by agents.

Format: `<type>[optional scope][!]: <description>`.

- `feat:` adds a user-visible feature and produces a minor release.
- `fix:` fixes a bug and produces a patch release.
- `feat!:` or a `BREAKING CHANGE:` footer marks a breaking change and produces a major release.
- `docs:`, `test:`, `refactor:`, `chore:`, `ci:`, `build:`, and `style:` are non-release changes.

Examples: `feat(frontend): add booking calendar`, `fix(backend): reject overlapping bookings`, `ci: add release-please workflow`.

Agent commits must follow the same format and must not use vague messages like `Update files`, `Fix stuff`, or `WIP`.
