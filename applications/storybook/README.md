# Proton Design System Storybook 🤘

This project is a storybook instance documenting Proton's design system in the scope of Web. It serves as both an isolated development environment for React Components as well as a source of centralized documentation all things design philosophy & technical documentation.

Storybook live can be accesed at: https://design-system.protontech.ch/

## Installation & Running

Run docs-only in development mode

```shell
yarn workspace proton-storybook docs # From root folder

yarn docs
```

Run in development mode

```shell
yarn workspace proton-storybook dev # From root folder

yarn dev
```

## Visual Testing

The current solution relies on `Playwright` to run visual tests against the `Storybook` stories, which captures all the stories defined for a given component inside one single page.

### CI

It runs as `storybook:test:visual` job defined [here](../../ci/jobs/storybook.gitlab-ci.yml).

## Update the snapshots

Given a MR that introduces any expected change that should lead to update the snapshots, just need to run **manually** in the CI the job `storybook:test:visual:update`, which will run the visual tests in update mode and commit the changes directly to the MR.

This way the changes can be reviewed as a standalone commit.

## Deployment

Storybook is deployed to Netlify using the `storybook:deploy` job, which runs only when a relevant commit is pushed to the main branch.
