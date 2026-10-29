import type { ProtonPluginSkill } from './types';

const LOCAL_FILES =
    "If you can read files on the user's computer (Lumo Desktop with file access on), read the relevant files yourself instead of asking for them to be pasted. Never write, edit or run anything unless the user asks.";

export const ENGINEERING_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'code-review',
        description:
            'Review code or a diff for bugs, security issues, readability and missing tests, with prioritized and actionable comments. Use for "review this code", "what\'s wrong with this?", or before merging.',
        instructions: `# Code review

Feedback a teammate would thank you for.

## Steps

1. Understand the intent first: what the change is meant to do. Ask if it isn't clear from the code or the description.
2. Check, in order: correctness and edge cases, security (injection, authentication, secrets, unsafe input), data loss and concurrency, error handling, performance where it matters, readability and naming, and tests.
3. Report comments grouped by severity: **Must fix**, **Should fix**, **Nit**. Give each the location, the problem, why it matters, and a suggested fix (show code when that's clearer).
4. End with a one-line overall verdict and anything done well that's worth keeping.

## Rules

- Be specific; point at lines or functions.
- Don't restyle working code to your taste. Follow the project's conventions.
- ${LOCAL_FILES}`,
    },
    {
        name: 'debug',
        description:
            'Debug systematically from an error message, stack trace or unexpected behavior: reproduce, isolate, find the root cause and fix it. Use for "why is this failing?", "I get this error…", or "it worked yesterday".',
        instructions: `# Debug

Find the root cause, not just a workaround.

## Steps

1. **Understand the failure:** expected versus actual behavior, the exact error, when it started, and what changed (code, dependencies, configuration, data).
2. **Form hypotheses,** most likely first, each with a quick way to confirm or rule it out (a log line, a minimal reproduction, a check).
3. **Narrow it down** with the user, one step at a time. Read the stack trace from the first frame in their own code.
4. **Fix it.** Explain the root cause, give the fix, and suggest a test that would have caught it.
5. For unfamiliar errors from libraries or tools, search the web for the exact message and check the official documentation and issue trackers.

## Rules

- Don't guess-and-patch. Each suggestion should follow from evidence.
- Call out side effects of the fix.
- ${LOCAL_FILES}`,
    },
    {
        name: 'write-tests',
        description:
            'Write focused tests for a function, module or bug fix, covering the happy path, edge cases and failures, in the project\'s test framework. Use for "write tests for…", "add test coverage", or after a bug fix.',
        instructions: `# Write tests

Tests that catch real bugs and are easy to maintain.

## Steps

1. Identify the framework and conventions from the code or by asking (for example Jest, Vitest, pytest or Go testing).
2. List the cases before writing: the happy path, boundaries (empty, zero, maximum, null), invalid input, error paths, and the bug being fixed, if any.
3. Write the tests: one behavior per test, a descriptive name, arrange-act-assert, and no testing of implementation details.
4. Mock only true external boundaries such as the network, time and randomness.
5. Say what's still untested and why.

## Rules

- Match the project's style and file layout.
- Make tests deterministic: no real network calls and no reliance on the current date.
- ${LOCAL_FILES}`,
    },
    {
        name: 'explain-code',
        description:
            'Explain what code does, how it fits together and why, from a snippet up to a whole module. Use for "what does this do?", "walk me through this code", or onboarding onto an unfamiliar codebase.',
        instructions: `# Explain code

From "what is this?" to "I could change this safely".

## Steps

1. **Start with the purpose:** what the code is for, in one or two sentences.
2. **Give the structure:** the main pieces and how data flows between them. Use a short list or a simple diagram for anything beyond a single function.
3. **Walk through the important parts** in execution order, explaining the non-obvious lines: clever tricks, side effects, concurrency and error handling.
4. **Point out the gotchas:** assumptions, edge cases, likely bugs, and what would break if changed.

## Rules

- Match the depth to the user's experience. Define language features a beginner might not know.
- Don't paraphrase every line; focus on what isn't obvious.
- ${LOCAL_FILES}`,
    },
    {
        name: 'design-doc',
        description:
            'Write a technical design document or architecture decision record (context, options, trade-offs, decision and rollout). Use for "write a design doc", "help me decide between…", "write an ADR", or planning a significant change.',
        instructions: `# Design doc

Make the decision and its reasoning clear to reviewers and future readers.

## Structure

1. **Summary:** the problem and the proposed solution, in a few sentences.
2. **Context and goals,** including non-goals and constraints.
3. **Options considered:** at least two, with pros, cons, cost and risk for each. Use a comparison table.
4. **Decision** and why it beats the alternatives.
5. **Design:** components, data flow, APIs and data model, as deep as the change needs.
6. **Risks, security and privacy,** and how they're mitigated.
7. **Rollout and testing,** including migration and how to roll back.
8. **Open questions.**

## Steps

- Ask for missing constraints (scale, deadlines, team skills) before recommending anything.
- Put the document in the canvas.

## Rules

- Be honest about trade-offs. A doc with only one real option isn't a decision.
- ${LOCAL_FILES}`,
    },
];
