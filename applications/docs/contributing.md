# Contributing guide

## Quick introduction

> Read the [README](./README.md) first if you haven't yet.

This is a React application. Some key points:

- It's a SPA, routing is handled with `react-router-dom`. Completely configuration based, although the file structure is inspired by file-based routers. Read more in the "Routes" section of [`CODING_STANDARDS.md`](./CODING_STANDARDS.md). Routes are lazily loaded with `React.lazy()` + `Suspense`.
- Styling is achieved with Tailwind CSS + Proton theme + SASS in some places.
  <!-- TODO: investigate and elaborate on the Proton theme stuff -->
  <!-- TODO: investigate and elaborate on some other relevant patterns like the pub/sub stuff -->
  <!-- TODO: investigate and elaborate generally on architecture, put excalidraw here as well -->

## Glossary

See [`GLOSSARY.md`](./GLOSSARY.md).

## File structure

### Tree

Here's a brief overview of the file structure:

```
src/app/             # Main directory
├── components/      # Components that are used in a lot of places. Mostly flat structure.
├── routes/          # Route-aware files. Pages, layouts, and local components and utilities. See `CODING_STANDARDS.md`.

       (TODO: complete)

└─── index.tsx        # Entrypoint. Loads the CSS files, and renders the public or user app.
```

## Coding standards

File naming, co-location, the `routes/` structure, and React, i18n, styling and testing conventions are in [`CODING_STANDARDS.md`](./CODING_STANDARDS.md).
