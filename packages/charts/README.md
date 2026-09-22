# @proton/charts

## Rules that are not obvious

- **No copy, no colours, no size.** Strings arrive as props or children. A caller says what a series _means_ (`fill: 'critical'`) and `theme.ts` resolves it against the active theme. Height comes from the container, and chart.js redraws when it changes; an unsized one draws at 16:5 rather than not at all.
- **The theme is read twice**: once during the first render, so a chart is never without colours and nothing downstream branches on their absence, and once a frame later in case the chart mounted before the stylesheet landed. An unchanged second read keeps the same object, so the ordinary case costs no re-render.
- **The canvas is hidden from assistive tech** unless a caller names it with `ariaLabel`. A canvas has no text in it, so the package leaves no text equivalent behind either: a page that needs one tabulates the series itself.
- **`ChartCard` is a card and rows down it**, one slot, as many as a page needs. A row is a band across the whole card and places nothing else: the elements, their heading level and how they sit inside the row are the caller's, since a card cannot know what section it is nested under. The row holding a chart needs `flex-auto min-h-0` to take the room the others leave, or the chart falls back to 16:5 — and not `flex-1`, whose zero basis resolves to a definite zero in an unsized card.
- **Registration happens at chart import.** Primitives call `registerCharts()` at module scope, so `package.json` lists them under `sideEffects`: a dropped registration is a blank canvas in a production build and nowhere else.

## Tests

`yarn test` covers the prop contract and the chart.js configuration, with `react-chartjs-2` mocked; `register.test.ts` is the exception and reads the real registry. Only `yarn test:visual` in `applications/storybook` proves a chart drew: Linux-only baselines, refreshed by the manual `storybook:test:visual:update` job, never committed from macOS.
