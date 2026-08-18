# Contributing to Cosmic Rangers

Contributions are welcome through pull requests.

## Workflow

1. Fork the repository.
2. Create a branch in your fork.
3. Make one focused change.
4. Open a pull request against `main`.
5. Wait for automated checks and maintainer review.

Direct pushes to `main` are not part of the contribution workflow.

## What makes a good PR

- Keeps the game playable on desktop and mobile.
- Avoids unnecessary dependencies and external trackers.
- Does not include secrets, credentials, tokens, or generated binaries.
- Keeps deployment/server changes separate from gameplay changes.
- Explains what changed and how it was tested.

## Security-sensitive changes

Changes to GitHub Actions, Docker, nginx, deployment configuration, or other infrastructure require extra maintainer review and will not be merged automatically.
