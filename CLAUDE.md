# Project Overview

This is a GitHub profile README repo (`kubk/kubk`).

## How it works

- `README-template.md` is the source of truth. It contains static content and `//repos` placeholder.
- `index.ts` generates `README.md` from the template by fetching GitHub star counts for contributed repos, sorting them by stars, and replacing `//repos`.
- **Never edit `README.md` directly for the contributions section** — edit `README-template.md` or `index.ts` instead.
- Static sections (bio, projects, blog posts) should be edited in both `README-template.md` and `README.md`. **Never leave them out of sync.**
