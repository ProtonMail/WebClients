import type { ProtonPluginSkill } from './types';

export const DATA_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'explore-data',
        description:
            'Profile a dataset and surface its key findings: structure, quality, trends, outliers and correlations. Use when a CSV or spreadsheet is shared, or for "what does this data show?".',
        instructions: `# Explore data

Get from a raw file to a clear picture of what's in it.

## Steps

1. **Profile it.** Rows, columns, data types, date range, units, and how many values are missing or malformed in each column. Ask about ambiguous columns rather than guessing.
2. **Summarize the numbers.** For numeric columns: count, mean, median, min, max and spread. For categories: the top values and their shares.
3. **Find the story.** Lead with the three most useful findings: trends over time, big differences between groups, outliers and strong relationships.
4. **Show it.** Add one or two charts as vega-lite code blocks with the data inline, and a small table for exact figures.
5. **Suggest next steps:** the questions worth asking next and any cleaning the data needs.

## Rules

- Never invent or extrapolate values. If something can't be computed from the data, say so.
- Correlation isn't causation. Say so when it matters.
- State sample sizes alongside percentages.`,
    },
    {
        name: 'chart',
        description:
            'Pick the right chart for a question and build it from the data. Use for "chart this", "plot…", "visualize…", or "show me a graph of…".',
        instructions: `# Chart

One clear chart that answers one question.

## Choose the chart

- Change over time: line chart.
- Comparing categories: bar chart, sorted, horizontal when labels are long.
- Parts of a whole: stacked bar. Use a pie only for two to four parts.
- Distribution: histogram or box plot.
- Relationship between two measures: scatter plot.

## Steps

1. Confirm what the chart should show. If the request is vague, pick the most likely question and say which one you chose.
2. Prepare the data: aggregate, filter and sort as needed, and say what you did.
3. Output a vega-lite code block with the data inline, a descriptive title, axis titles with units, and tooltips.
4. Add one sentence on what the chart shows.

## Rules

- Start bar charts at zero. Don't use dual axes or 3D effects.
- Use at most about seven colors. Group the rest as "Other".
- For slides or reports, offer to place the chart in a presentation or document in the canvas.`,
    },
    {
        name: 'clean-data',
        description:
            'Find and fix problems in a dataset (duplicates, missing values, inconsistent formats, typos in categories) and return a cleaned version. Use for "clean this data", "fix this spreadsheet", or before an analysis.',
        instructions: `# Clean data

Make a dataset trustworthy, and show exactly what changed.

## Steps

1. **Audit.** List the issues by column: duplicates, missing values, mixed formats (dates, currencies, units), inconsistent category spellings, impossible values and stray whitespace.
2. **Propose fixes** in a short table (issue, rows affected, proposed fix). Ask before anything destructive, such as dropping rows or imputing values.
3. **Apply them** and return the cleaned data as CSV in the canvas as code, so it's easy to copy or download.
4. **Log the changes:** counts of rows removed, values changed and anything you left alone on purpose.

## Rules

- Never silently drop or invent data. Flag ambiguous cases for the user.
- Keep the original column names unless the user asks to rename them.
- Use ISO dates (YYYY-MM-DD) unless the user prefers another format.`,
    },
    {
        name: 'dashboard',
        description:
            'Build an interactive dashboard from a dataset as a self-contained web page, with filters, key figures and charts. Use for "make a dashboard", "build a report I can click through", or for sharing data with others.',
        instructions: `# Dashboard

An interactive page that answers the user's recurring questions about their data.

## Steps

1. **Agree the purpose.** Who will read it and the three to five questions it must answer. Ask with a question card if unclear.
2. **Plan the layout:** a row of key figures at the top, then charts that answer each question, then a detail table.
3. **Build it in the canvas as a web page.** It must be one self-contained HTML file: inline CSS and JavaScript, the data embedded, and no external scripts, fonts or network requests.
4. **Add interaction:** filters for the main dimensions (date range, category), tooltips, and a sortable table.
5. **Summarize** what's on the dashboard in two or three lines after building it.

## Rules

- Draw charts with plain SVG or canvas code inside the page; nothing can be loaded from the internet.
- Make it readable on a laptop screen and in both light and dark color schemes.
- Compute every figure from the embedded data. Never hard-code results.`,
    },
];
