# @proton/atoms

The 'atoms' of the atomic-design component-architecture paradigm: https://bradfrost.com/blog/post/atomic-web-design/

The 'atoms' folder is home to proton brand-identity design-system specific reusable components which work independently of the applications they are used inside of.

Fit the description of base components / presentational components / dumb components / pure components.

Necessarily compositional.

Ideally functional, controlled (only props in events out) & stateful only to the containment of local ui-logic e.g. hover / focus states.

1 module per component. Should be kept 1 level deep. No grouping or nesting (other than for purely semantic co-location as in a component is so complex that its implementation details spans across multiple files).

## How to run it locally

- Run Storybook dev server with: `yarn storybook:dev`
- Build storybook with: `yarn storybook:build`

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
