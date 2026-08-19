# Cosmic Rangers

Browser arcade game deployed at `https://cosmic-rangers.bacus.dev`.

## Controls

- Move: WASD or arrow keys
- Fire: Space
- Boost: Shift
- Pause: P
- Mobile: on-screen controls

## Run locally

Open `index.html` directly, or serve the repository with any static HTTP server.

## Production

The production image is a small nginx container listening on port `8080`. Deployment is handled by the bacus self-hosted GitHub Actions runner.

Production deployment is triggered automatically by pushes to `main`.
