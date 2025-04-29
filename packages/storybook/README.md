# @proton/storybook

**IMPORTANT**: this is a temporary package to allow a progressive migration from `Storybook` v6 to v8.

## Visual Testing

The current solution relies on `Playwright` to run visual tests against the `Storybook` `--doc` stories, which captures all the stories defined for a given component inside one single page.

### Locally

**Prerequisite**: Docker installed and running.

- `yarn docker:build`
- `yarn docker:run`
- `yarn storybook:test:visual` (From inside the container)

Any visual change should be visible inside the `tests` folder.

NOTE: to stop the container just run `docker rm storybook-atoms`

#### Update the snapshots

`yarn storybook:test:visual:update` (From inside the container)

### CI

It runs as `storybook:atoms:test:visual` job defined [here](https://gitlab.protontech.ch/web/clients/-/blob/main/ci/jobs/storybook.gitlab-ci.yml?ref_type=heads).
