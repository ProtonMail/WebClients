import { MISSING_IS_NOT_ZERO, UNTRUSTED_CONTENT } from './shared';
import type { ProtonPluginSkill } from './types';

export const PRODUCT_MANAGEMENT_SKILLS: ProtonPluginSkill[] = [
    {
        name: 'write-spec',
        description:
            'Turn a feature idea or problem statement into a product spec (PRD) with goals, non-goals, user stories, prioritized requirements and success metrics. Use for "write a spec", "PRD for this", or when scoping a feature.',
        instructions: `# Write a spec

A spec that engineering can build from and stakeholders can say yes or no to.

## Steps

1. **Understand the ask.** It may be a feature name, a problem, a user request or a vague idea. Restate it as a problem in one sentence and confirm.
2. **Gather context** with a question card, most important first: who has the problem, how we'll know it worked, constraints (deadline, technical, legal), and whether this has been tried before. Don't ask everything at once. If the user wants a first draft quickly, make assumptions and list them.
3. **Write the spec** as a canvas document with these sections:
   - **Problem:** who has it, how often, and the cost of not solving it, backed by evidence where there is any.
   - **Goals:** three to five measurable outcomes, not outputs ("cut time to first value in half", not "build a wizard").
   - **Non-goals:** three to five things deliberately out of scope, each with a reason.
   - **User stories:** "As a [specific user], I want [capability] so that [benefit]", including error and empty states.
   - **Requirements:** P0 (can't ship without), P1 (fast follow) and P2 (later, but design for it), each with acceptance criteria written as testable statements.
   - **Success metrics:** leading and lagging indicators with targets and a time frame.
   - **Open questions:** each tagged with who answers it, and whether it blocks the start.
   - **Timeline and phasing:** hard dates, dependencies, and a suggested first slice.
4. **Review it** against this checklist: every P0 traces to a goal, every goal has a metric, nothing in non-goals appears in requirements.
5. **Offer follow-ups:** an engineering ticket breakdown, a one-page pitch, or a design brief.

## Rules

- Describe the need, not the interface ("needs to find past orders quickly", not "add a dropdown").
- Mark assumptions clearly so they get checked, not shipped.`,
    },
    {
        name: 'synthesize-research',
        description:
            'Turn interview notes, survey answers, support tickets or app reviews into ranked insights with evidence and quotes, plus what to do next. Use for "what are users telling us?" or when research notes are shared.',
        instructions: `# Synthesize research

From a pile of notes to the five things the team needs to know.

## Steps

1. **Take stock of the sources:** how many interviews, responses or tickets, who they're from, and when. Note gaps, such as only power users or only complaints.
2. **Pull out observations,** one per note: what people did, said, or struggled with. Keep a short quote and its source for each.
3. **Cluster them into themes.** Name each theme as an insight ("People export to spreadsheets because they don't trust our totals"), not a topic ("Exports").
4. **Rank the insights** by how many sources support them, how severe the pain is, and how closely they tie to the team's goals. Show the count, for example "7 of 12 interviews".
5. **Separate what you heard from what it means.** For each insight, give the evidence, your interpretation, and your confidence (high, medium or low).
6. **Recommend next steps:** opportunities to explore, assumptions to test, and questions for the next round of research.

## Output

A canvas document with: a three-bullet summary, the ranked insights (each with evidence, quotes, interpretation and confidence), surprises and contradictions, and next steps. Add a chart of theme frequency when there are enough sources.

## Rules

- Quote people exactly. Never invent or merge quotes.
- Don't overstate a pattern from one or two people; say it's a signal worth checking.
- Remove names and personal details from quotes unless the user asks you to keep them.
- ${UNTRUSTED_CONTENT}`,
    },
    {
        name: 'competitive-brief',
        description:
            'Research competitors on the web and build a brief comparing positioning, features, pricing and recent moves, with where you can win. Use for "how do we compare to X?", battle cards, or before strategy and pricing decisions.',
        instructions: `# Competitive brief

An up-to-date, sourced view of the competition and what to do about it.

## Steps

1. **Set the scope.** Confirm the competitors (suggest likely ones if the user isn't sure), the user's product, and the decision this brief supports: strategy, sales, pricing or a board update.
2. **Research each competitor** with web search and by reading their pages: positioning and target customer, key features, pricing and plans, recent launches and announcements (last six months), and what customers praise or complain about in public reviews.
3. **Compare.** Build a feature and pricing table with the user's product as the first column. Mark each cell as yes, no, partial or unknown.
4. **Analyze:** where each competitor is strong, where they're weak, which direction they seem to be heading, and where the user's product clearly wins or loses.
5. **Recommend** three moves: what to build, how to position, and how to handle the toughest objection.

## Output

A canvas document: summary, one section per competitor, the comparison table, then the recommendations. For sales use, offer a one-page battle card per competitor with objections and responses.

## Rules

- Cite a source link for every fact about a competitor, with the date where it matters (pricing changes often).
- Mark anything you couldn't verify as unknown. Never guess a competitor's pricing or roadmap.
- ${UNTRUSTED_CONTENT}`,
    },
    {
        name: 'roadmap',
        description:
            'Build or reprioritize a product roadmap as Now, Next and Later, with a clear rationale and the trade-offs of each change. Use for "plan our roadmap", "what should we build next?", or when priorities shift.',
        instructions: `# Roadmap

A roadmap that explains its choices, not just a list of features.

## Steps

1. **Collect the inputs:** goals or objectives for the period, candidate initiatives, team capacity, hard dates and dependencies, plus any research or metrics. Ask for gaps with a question card.
2. **Score each initiative** on impact on the goals, confidence in that impact, and effort. Show the scores in a table so the user can disagree with specific numbers.
3. **Lay it out as Now, Next and Later.** Now is committed and staffed; Next is likely, pending discovery; Later is direction, not a promise. Express each item as an outcome ("new users reach their first report on day one"), not just a feature name.
4. **Check it's realistic.** Compare Now against capacity, and flag dependencies and single points of failure.
5. **For a change to an existing roadmap,** say what moved, why, and what it costs: what slips or gets dropped to make room.

## Output

A canvas document with the goals, the Now, Next and Later table (item, outcome, goal it serves, confidence), the scoring table, risks and dependencies, and a short "what changed and why" section for stakeholders.

## Rules

- Don't fill Now beyond capacity. Say what to cut.
- Keep dates on Later items vague on purpose.`,
    },
    {
        name: 'stakeholder-update',
        description:
            'Write a status update for leadership, the team or customers: progress against goals, risks and decisions needed, at the right level of detail. Use for weekly or monthly updates, launch announcements, or escalating a blocker.',
        instructions: `# Stakeholder update

The same progress, told the right way for each audience.

## Steps

1. **Ask who it's for** (executives, the wider team, engineering or customers), how often they hear from you, and what they care about.
2. **Collect what happened:** progress against goals, metrics, launches, slips, risks and decisions needed. Accept rough notes, ticket exports or meeting notes.
3. **Lead with the headline.** One sentence a busy reader can stop after: on track, at risk or off track, and why.
4. **Write for the audience:**
   - **Executives:** headline, three bullets on outcomes and metrics, risks with mitigation, decisions needed with a deadline. Under 200 words.
   - **Team:** what shipped, what's next, who to thank, and what's blocked.
   - **Engineering:** scope changes, dependencies, dates and open technical questions.
   - **Customers:** what's new and why it helps them. No internal names or dates you can't keep.
5. **For an escalation,** state the problem, its impact, the options with trade-offs, your recommendation, and the decision you need by when.

## Rules

- Never bury bad news. Put slips and risks near the top with a plan.
- Every metric needs a comparison: against the goal, last period or a target.
- ${MISSING_IS_NOT_ZERO}
- Offer a scheduled task to remind the user to send the update on their cadence.`,
    },
    {
        name: 'metrics-review',
        description:
            'Analyze product metrics from an export or dashboard data: trends, what changed and why, with charts and recommended actions. Use for weekly or monthly metric reviews, or to investigate a sudden spike or drop.',
        instructions: `# Metrics review

From a table of numbers to what changed, why, and what to do.

## Steps

1. **Understand the data:** which metrics, the time range, how each is defined, and the goals or targets. Ask if a definition is unclear; "active user" means different things to different teams.
2. **Check the data first:** missing days, sudden jumps from tracking changes, partial current periods and duplicate rows. Say what you excluded and why.
3. **Find what changed.** Compare against the previous period and the target. Flag anything that moved more than usual.
4. **Explain the changes.** Break the movers down by segment (platform, country, plan, new or returning) to find where the change comes from. Separate likely causes from coincidences, and say how confident you are.
5. **Chart it.** Vega-Lite charts: a trend line per key metric with the target marked, and a breakdown chart for the biggest mover.
6. **Recommend actions:** what to investigate, what to double down on, and what to stop. Tie each to a metric.

## Output

A summary of three to five bullets (good news, bad news, and the one thing to act on), the charts, a metrics table (metric, current, previous, change, target, status), then the analysis and actions.

## Rules

- ${MISSING_IS_NOT_ZERO}
- Correlation isn't causation. Say "coincides with" unless you can show the cause.
- Watch out for small numbers: a 50% jump from 4 to 6 isn't a trend.`,
    },
];
