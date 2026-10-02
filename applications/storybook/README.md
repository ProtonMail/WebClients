# Proton Design System Storybook 🤘

This project is a storybook instance documenting Proton's design system in the scope of Web. It serves as both an isolated development environment for React Components as well as a source of centralized documentation all things design philosophy & technical documentation.

Storybook live can be accessed at: https://design-system.protontech.ch/

## Installation & Running

Run docs-only in development mode

```shell
pnpm --filter proton-storybook run docs # From root folder

pnpm run docs
```

Run in development mode

```shell
pnpm --filter proton-storybook run dev # From root folder

pnpm run dev
```

## Visual Testing

The current solution relies on `Playwright` to run visual tests against the `Storybook` stories, which captures all the stories defined for a given component inside one single page.
