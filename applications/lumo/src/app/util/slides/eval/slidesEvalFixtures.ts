/**
 * Eval inputs for generated decks. Each has the user's source material and deck JSON written by
 * hand the way the model is expected to write it, so this set tests the renderer and checks, not
 * the model. Companies and figures are fictional.
 */

export interface SlidesEvalFixture {
    id: string;
    /** What the fixture stresses. */
    purpose: string;
    /** The user's material: what every number on the slides must come from. */
    source: string;
    /** Model output, before parsing. */
    modelOutput: unknown;
    /** Numbers the data check must flag (and only these). */
    expectedUnsourced: string[];
    /** At least this many slides after splitting. */
    minSlides?: number;
}

const NORTHWIND_SOURCE = `Northwind Coffee — Q3 2026 results (internal memo)

Revenue by region (€ thousands):
| Region | Q2 2026 | Q3 2026 |
| North | 410 | 455 |
| South | 380 | 362 |
| East | 295 | 341 |
| West | 220 | 268 |

Online orders per month: July 12,400; August 13,150; September 14,900.
We opened 3 new stores (Lyon, Ghent, Porto), bringing the total to 28.
Customer satisfaction (NPS) rose from 41 to 47.
South declined because of the roadworks outside our two busiest stores.
Next quarter: launch the subscription plan, hire 2 regional managers, refit the South stores.`;

const northwind = {
    title: 'Northwind Coffee Q3 2026',
    slides: [
        {
            layout: 'title',
            title: 'Northwind Coffee: Q3 2026 Results',
            subtitle: 'Quarterly update for the leadership team',
            notes: 'Open with the headline: three of four regions grew.',
        },
        {
            layout: 'bullets',
            title: 'Highlights',
            bullets: [
                'Revenue grew in North, East and West',
                { text: 'East grew fastest, from 295 to 341 (€ thousands)', level: 2 },
                'South declined from 380 to 362 because of roadworks outside our two busiest stores',
                'Opened 3 new stores in Lyon, Ghent and Porto, for 28 in total',
                'Customer satisfaction (NPS) rose from 41 to 47',
            ],
            notes: 'Keep this slide short; the charts carry the detail.',
        },
        {
            layout: 'chart',
            title: 'Revenue by Region',
            chart: {
                kind: 'bar',
                categories: ['North', 'South', 'East', 'West'],
                series: [
                    { name: 'Q2 2026', values: [410, 380, 295, 220] },
                    { name: 'Q3 2026', values: [455, 362, 341, 268] },
                ],
                unit: '€ thousands',
                source: 'Revenue by region table in the Q3 memo',
            },
            takeaway: 'Three of four regions grew; South dipped because of roadworks.',
        },
        {
            layout: 'chart',
            title: 'Online Orders Per Month',
            chart: {
                kind: 'line',
                categories: ['July', 'August', 'September'],
                series: [{ name: 'Orders', values: [12400, 13150, 14900] }],
                source: 'Online orders in the Q3 memo',
            },
        },
        {
            layout: 'bullets',
            title: 'Next Quarter',
            bullets: ['Launch the subscription plan', 'Hire 2 regional managers', 'Refit the South stores'],
        },
    ],
};

const DENSE_SOURCE = `Product brief: Atlas field app. The app lets technicians log inspections offline and sync later.
Pilot feedback from 6 regional teams: offline mode works, but sync conflicts confuse people, photo
uploads are slow on 3G, and the checklist editor needs templates. Security asked for device-level
encryption and remote wipe before the wider rollout. Supervisors asked for a weekly email summary.`;

const denseBullets = {
    title: 'Atlas Pilot Feedback',
    slides: [
        {
            layout: 'bullets',
            title: 'What the Pilot Teams Told Us',
            bullets: [
                'Offline mode works well: technicians logged inspections all day without a connection and synced later',
                'Sync conflicts confuse people, because the app doesn’t explain which version it kept or why',
                'Photo uploads are slow on 3G, so technicians wait at the end of the day before they can leave',
                'The checklist editor needs templates; teams rebuild the same checklist for every site',
                'Security asked for device-level encryption and remote wipe before the wider rollout',
                'All 6 regional teams want to keep using the app after the pilot ends',
                'Supervisors want a weekly summary of completed inspections by site, sent to them by email',
            ],
        },
    ],
};

const SPLIT_SOURCE = `Onboarding checklist for new engineers (from the team wiki): laptop setup, accounts, repositories,
first week plan, people to meet, security training, on-call shadowing, coding standards, review
etiquette, release process, incident process, documentation habits, and the 30/60/90 day goals.`;

const splitList = {
    title: 'Engineering Onboarding',
    slides: [
        {
            layout: 'bullets',
            title: 'Your First Weeks on the Team',
            bullets: [
                'Set up your laptop with the standard developer image',
                { text: 'Install the VPN client and the password manager first', level: 2 },
                'Request accounts for the code host, the issue tracker and chat',
                'Clone the main repositories and run the test suites locally',
                { text: 'Ask in the team channel if a suite fails on a clean checkout', level: 2 },
                'Read the first week plan your manager prepared',
                'Meet the people on the list: your buddy, your tech lead and the product manager',
                'Complete the security training before you get production access',
                'Shadow the on-call engineer for one rotation',
                { text: 'You only observe; you are not paged', level: 2 },
                'Read the coding standards and the review etiquette page',
                'Walk through the release process with your buddy',
                'Read the incident process and the last three incident reviews',
                'Write down anything that was hard to find, so we can fix the docs',
                'Agree your 30/60/90 day goals with your manager',
            ],
        },
    ],
};

const GERMAN_SOURCE = `Projektstatus Datenschutz: Die Datenschutzgrundverordnungskonformitätsprüfung für das
Kundenportal ist zu 80% abgeschlossen. Offene Punkte: Auftragsverarbeitungsverträge mit 4
Dienstleistern, Löschkonzept für Bestandsdaten, Schulung der Kundendienstmitarbeitenden.`;

const german = {
    title: 'Datenschutz Projektstatus',
    slides: [
        {
            layout: 'title',
            title: 'Datenschutzgrundverordnungskonformitätsprüfung für das Kundenportal',
            subtitle: 'Projektstatus und offene Punkte',
        },
        {
            layout: 'bullets',
            title: 'Offene Punkte der Datenschutzgrundverordnungskonformitätsprüfung',
            bullets: [
                'Prüfung zu 80% abgeschlossen',
                'Auftragsverarbeitungsverträge mit 4 Dienstleistern abschließen',
                'Löschkonzept für Bestandsdaten fertigstellen',
                'Schulung der Kundendienstmitarbeitenden planen',
            ],
        },
    ],
};

const MISSING_SOURCE = `Pitch outline for the seed round: problem (small clinics lose hours on paper intake forms),
solution (a tablet intake app), traction (12 clinics in the pilot), team, ask. We don't have
market size numbers yet; Sara is pulling them from the industry report next week.`;

const missingData = {
    title: 'Seed Pitch',
    slides: [
        { layout: 'title', title: 'Clinic Intake, Without the Paper', subtitle: 'Seed round' },
        {
            layout: 'bullets',
            title: 'Traction',
            bullets: ['12 clinics use the tablet intake app in the pilot'],
        },
        {
            layout: 'chart',
            title: 'Market Size',
            chart: { missing: 'market size figures from the industry report (Sara, next week)' },
            notes: 'Placeholder until Sara sends the industry report numbers.',
        },
    ],
    gaps: ['Market size numbers'],
};

const INVENTED_SOURCE = `Support tickets per weekday last week: Monday 140, Tuesday 122, Wednesday 118, Thursday 131, Friday 96.`;

// Negative control: Friday says 104 but the source says 96, and the takeaway quotes an average
// that isn't in the source. The data check must flag both.
const invented = {
    title: 'Support Load',
    slides: [
        {
            layout: 'chart',
            title: 'Tickets per Weekday',
            chart: {
                kind: 'bar',
                categories: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                series: [{ name: 'Tickets', values: [140, 122, 118, 131, 104] }],
                source: 'Support ticket counts from last week',
            },
            takeaway: 'Mondays are busiest; the weekly average was 123 tickets.',
        },
    ],
};

const PIE_SOURCE = `Where our trial users came from in September: search 42%, referrals 27%, newsletter 19%, social 12%.`;

const pie = {
    title: 'Trial Sources',
    slides: [
        {
            layout: 'chart',
            title: 'Where Trial Users Came From in September',
            chart: {
                kind: 'pie',
                categories: ['Search', 'Referrals', 'Newsletter', 'Social'],
                series: [{ name: 'Share of trials (%)', values: [42, 27, 19, 12] }],
                unit: '%',
                source: 'September acquisition split',
            },
            takeaway: 'Search and referrals bring in over two thirds of trials.',
        },
    ],
};

const MESSY_SOURCE = `Units sold per quarter, 2026: Q1 1,200; Q2 1,350; Q3 1,410. Six product lines: Alpha, Beta,
Gamma, Delta, Epsilon, Zeta each sold 200 units in Q1.`;

// What a model gets wrong: numbers as strings, layout names we don't use, too many series, a
// level-3 bullet, an empty bullet, an unknown chart kind.
const messy = {
    version: 1,
    title: 'Sales 2026',
    slides: [
        {
            layout: 'content',
            title: 'Units Sold',
            bullets: ['Q1 1,200 units', '', { text: 'Q2 1,350 units', level: 3 }, 'Q3 1,410 units'],
        },
        {
            layout: 'chart',
            title: 'Units per Quarter',
            chart: {
                kind: 'column',
                categories: ['Q1', 'Q2', 'Q3'],
                series: [{ name: 'Units', values: ['1,200', '1,350', '1,410'] }],
                source: 'Units sold per quarter',
            },
        },
        {
            layout: 'chart',
            title: 'Q1 by Product Line',
            chart: {
                kind: 'bar',
                categories: ['Q1'],
                series: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'].map((name) => {
                    return { name, values: [200] };
                }),
                source: 'Product line sales, Q1',
            },
        },
    ],
};

const CJK_SOURCE = `新製品の発売計画：10月に東京で発表、11月に大阪と名古屋で販売開始。初回生産は5000台。`;

const cjk = {
    title: '新製品の発売計画',
    slides: [
        { layout: 'title', title: '新製品の発売計画と販売スケジュールについて', subtitle: '営業部向け説明資料' },
        {
            layout: 'bullets',
            title: '発売スケジュール',
            bullets: ['10月：東京で新製品を発表', '11月：大阪と名古屋で販売開始', '初回生産は5000台'],
        },
    ],
};

const NEW_LAYOUTS_SOURCE = `Section dividers: Part 1 covers strategy, Part 2 covers execution.
Quote from CEO: "We built this product for the people who never had access before." — Maria Chen, CEO.
Two-column comparison: Left column: fast (launch in 30 days, low cost at €5,000, scalable). Right column: slow (launch in 90 days, high cost at €25,000, robust).`;

const newLayouts = {
    version: 1,
    title: 'New Layout Types',
    slides: [
        {
            layout: 'title',
            title: 'New Layout Types Demo',
            subtitle: 'Section, two-column and quote slides',
        },
        {
            layout: 'section',
            title: 'Part 1: Strategy',
            subtitle: 'Where we are going',
        },
        {
            layout: 'quote',
            quote: 'We built this product for the people who never had access before.',
            attribution: '— Maria Chen, CEO',
        },
        {
            layout: 'section',
            title: 'Part 2: Execution',
        },
        {
            layout: 'two-column',
            title: 'Fast vs Slow Approach',
            left: ['Launch in 30 days', 'Low cost at €5,000', 'Scalable from day one'],
            right: ['Launch in 90 days', 'High cost at €25,000', 'More robust at scale'],
            notes: 'Ask the team which approach fits the current runway.',
        },
    ],
    gaps: [],
    calculated: [],
};

const ROADMAP_SOURCE = `Product roadmap H2 2026 — engineering all-hands notes.
Q3 shipped: SSO integration (30 enterprise customers onboarded), mobile offline mode, redesigned onboarding flow (drop-off fell from 42% to 28%).
Q4 plan: public API v2 (6 endpoints), real-time collaboration (10ms target latency), SOC 2 Type II audit (must complete by December).
Team headcount stays at 18 engineers for H2.`;

const roadmapSectionDeck = {
    version: 1,
    title: 'Product Roadmap H2 2026',
    slides: [
        {
            layout: 'title',
            title: 'Product Roadmap · H2 2026',
            subtitle: 'Engineering all-hands, November 2026',
            notes: 'Keep this under 5 minutes — the detail is in the bullets.',
        },
        {
            layout: 'section',
            title: 'Q3 Review',
            subtitle: 'What shipped',
        },
        {
            layout: 'bullets',
            title: 'Q3 Highlights',
            bullets: [
                'SSO integration launched — 30 enterprise customers onboarded in the first month',
                { text: 'SAML 2.0 and OIDC supported; SCIM provisioning on the roadmap', level: 2 },
                'Mobile offline mode: technicians can log inspections without a connection',
                'Onboarding redesign cut drop-off from 42% to 28%',
            ],
        },
        {
            layout: 'section',
            title: 'Q4 Plan',
            subtitle: "What's next",
        },
        {
            layout: 'bullets',
            title: 'Q4 Priorities',
            bullets: [
                'Public API v2 with 6 endpoints (read and write)',
                'Real-time collaboration — target end-to-end latency under 10ms',
                'SOC 2 Type II audit — must complete by December',
                { text: 'Evidence collection starts in week one; no feature freeze required', level: 2 },
                'Team headcount stays at 18 engineers for the full half',
            ],
            notes: 'Call out the SOC 2 dependency on security: they own the evidence review.',
        },
    ],
    gaps: [],
    calculated: [],
};

const COMPARISON_SOURCE = `Build vs buy analysis for search infrastructure.
Build option: launch in 6 weeks, estimated cost €18,000 in engineering time, full control over ranking and data privacy, maintenance owned by the platform team, can be tuned to our data model.
Buy option: launch in 1 week (SaaS trial), €2,400 per month (€28,800 per year), vendor handles scaling and uptime, GDPR data-residency clause needs legal review, limited ranking customisation.
Risks: building means a longer time to first result and about 0.5 FTE per quarter of maintenance after launch; buying means vendor lock-in after 12 months of indexed data, and we cannot rerank by our proprietary signals.
Recommendation from the team: start with the vendor's SaaS trial for 3 months, build an abstraction layer now, and revisit at month 3.`;

const twoColumnDeck = {
    version: 1,
    title: 'Build vs Buy: Search Infrastructure',
    slides: [
        {
            layout: 'title',
            title: 'Build vs Buy: Search Infrastructure',
            subtitle: 'Decision brief for the platform team',
        },
        {
            layout: 'two-column',
            title: 'Build In-House',
            left: [
                'Launch in 6 weeks',
                '€18,000 one-time engineering cost',
                'Full control over ranking and data privacy',
                'Tunable to our own data model',
            ],
            right: [
                'Launch in 1 week (SaaS trial)',
                '€2,400 per month (€28,800 per year)',
                'Vendor owns scaling and uptime',
                'GDPR data-residency clause needs legal review',
            ],
            notes: 'The left column is build; the right column is buy. Present both before the recommendation.',
        },
        {
            layout: 'two-column',
            title: 'Risks',
            left: [
                'Longer time to first result',
                'Platform team carries maintenance forever',
                { text: 'Estimated 0.5 FTE per quarter after launch', level: 2 },
            ],
            right: [
                'Vendor lock-in after 12 months of indexed data',
                'Limited ranking customisation',
                { text: 'Cannot rerank by our proprietary signals', level: 2 },
            ],
        },
        {
            layout: 'bullets',
            title: 'Recommendation',
            bullets: [
                'Start with the vendor SaaS trial for 3 months',
                'Build the abstraction layer now so a switch later costs weeks, not months',
                'Revisit at month 3: if ranking quality is insufficient, build',
            ],
        },
    ],
    gaps: [],
    calculated: [],
};

const QUOTES_SOURCE = `Customer interviews, October 2026.
"The old interface made me feel like I needed a manual. The new one just worked." — Priya Nair, operations lead at a 200-person logistics firm.
"We were losing one engineer a quarter to alert fatigue. Since we switched, our on-call rotation is almost boring — in the best way." — Marcus Webb, infrastructure lead.
"I showed it to my grandmother and she set it up herself. That's the bar we were aiming for." — Sofia Andersen, product manager.`;

const quoteDeck = {
    version: 1,
    title: 'Customer Voice · October 2026',
    slides: [
        {
            layout: 'title',
            title: 'Customer Voice',
            subtitle: 'Interviews · October 2026',
        },
        {
            layout: 'quote',
            quote: 'The old interface made me feel like I needed a manual. The new one just worked.',
            attribution: '— Priya Nair, operations lead',
            notes: 'Priya runs a 200-person logistics firm. Use this to open the customer-empathy section.',
        },
        {
            layout: 'quote',
            quote: 'We were losing one engineer a quarter to alert fatigue. Since we switched, our on-call rotation is almost boring — in the best way.',
            attribution: '— Marcus Webb, infrastructure lead',
        },
        {
            layout: 'quote',
            quote: "I showed it to my grandmother and she set it up herself. That's the bar we were aiming for.",
            attribution: '— Sofia Andersen, product manager',
            notes: 'Close on this one — it always lands well.',
        },
    ],
    gaps: [],
    calculated: [],
};

const ALL_LAYOUTS_SOURCE = `Annual review summary for Meridian Analytics, FY 2026.
Revenue: €4.2M (up from €3.1M in FY 2025, 35% growth; €2.1M in FY 2024). ARR €3.8M. Net revenue retention 118%.
Q1 key wins: launched the dashboard builder, signed 4 enterprise accounts.
Q4 key wins: API v2 shipped, headcount grew from 22 to 31.
Biggest challenge: churn in the SMB segment — 14% annual churn vs 8% target.
Plan for FY 2027: expand enterprise segment (target 10 new logos), rebuild SMB onboarding to bring churn under 10%, hire 6 engineers (3 platform, 2 product, 1 data).
"The product has finally caught up with the vision." — Jordan Kim, CEO.`;

const allLayoutsDeck = {
    version: 1,
    title: 'Meridian Analytics · FY 2026 Review',
    slides: [
        {
            layout: 'title',
            title: 'Meridian Analytics · FY 2026 Annual Review',
            subtitle: 'Board presentation · November 2026',
        },
        {
            layout: 'section',
            title: 'FY 2026 in Numbers',
            subtitle: 'Revenue, retention and growth',
        },
        {
            layout: 'chart',
            title: 'Annual Revenue',
            chart: {
                kind: 'bar',
                categories: ['FY 2024', 'FY 2025', 'FY 2026'],
                series: [{ name: 'Revenue (€M)', values: [2.1, 3.1, 4.2] }],
                unit: '€M',
                source: 'Annual review summary: revenue figures',
            },
            takeaway: '35% year-on-year growth; ARR reached €3.8M with 118% net revenue retention.',
        },
        {
            layout: 'two-column',
            title: 'FY 2026 Highlights vs Challenges',
            left: [
                'Dashboard builder shipped in Q1',
                '4 enterprise accounts signed',
                'API v2 launched in Q4',
                'Headcount grew from 22 to 31',
            ],
            right: [
                'SMB churn at 14% — above 8% target',
                'Onboarding flow still causing early drop-off',
                'Support ticket volume grew faster than revenue',
            ],
        },
        {
            layout: 'bullets',
            title: 'FY 2027 Plan',
            bullets: [
                'Expand enterprise segment — target 10 new logos',
                'Rebuild SMB onboarding to bring churn under 10%',
                { text: 'Dedicated onboarding team of 2 starts in January', level: 2 },
                'Hire 6 engineers: 3 platform, 2 product, 1 data',
            ],
        },
        {
            layout: 'quote',
            quote: 'The product has finally caught up with the vision.',
            attribution: '— Jordan Kim, CEO',
            notes: 'Close the deck on this. Pause and let it land.',
        },
    ],
    gaps: [],
    calculated: [{ value: '35%', how: 'Revenue growth: (4.2 - 3.1) / 3.1 = 35.5%, rounded to 35%' }],
};

export const SLIDES_EVAL_FIXTURES: SlidesEvalFixture[] = [
    {
        id: 'northwind-q3',
        purpose: 'Primary end-to-end input: memo with a table → title, bullets, bar and line charts, notes',
        source: NORTHWIND_SOURCE,
        modelOutput: northwind,
        expectedUnsourced: [],
    },
    {
        id: 'dense-bullets',
        purpose: 'Seven long bullets: must shrink below the largest body size and stay on one slide',
        source: DENSE_SOURCE,
        modelOutput: denseBullets,
        expectedUnsourced: [],
    },
    {
        id: 'split-list',
        purpose: 'Fifteen bullets with sub-bullets: must split across slides, sub-bullets kept with parents',
        source: SPLIT_SOURCE,
        modelOutput: splitList,
        expectedUnsourced: [],
        minSlides: 2,
    },
    {
        id: 'german-compounds',
        purpose: 'German with very long compound words in titles: shrink and line breaking',
        source: GERMAN_SOURCE,
        modelOutput: german,
        expectedUnsourced: [],
    },
    {
        id: 'missing-data',
        purpose: 'Chart requested without data: a visible "Data needed" box, no invented chart',
        source: MISSING_SOURCE,
        modelOutput: missingData,
        expectedUnsourced: [],
    },
    {
        id: 'invented-number',
        purpose: 'Negative control: one chart value and one quoted average are not in the source',
        source: INVENTED_SOURCE,
        modelOutput: invented,
        expectedUnsourced: ['104', '123'],
    },
    {
        id: 'pie-shares',
        purpose: 'Pie chart with percentage shares and a takeaway',
        source: PIE_SOURCE,
        modelOutput: pie,
        // "two thirds" is words, not a number, so nothing is flagged.
        expectedUnsourced: [],
    },
    {
        id: 'messy-output',
        purpose: 'Repairs: numbers as text, unknown layout and chart kind, 6 series, level-3 and empty bullets',
        source: MESSY_SOURCE,
        modelOutput: messy,
        expectedUnsourced: [],
    },
    {
        id: 'cjk-text',
        purpose: 'Japanese text: characters outside Arial are measured as one em each',
        source: CJK_SOURCE,
        modelOutput: cjk,
        expectedUnsourced: [],
    },
    {
        id: 'new-layouts',
        purpose: 'Section dividers, two-column bullets and a quote slide render correctly',
        source: NEW_LAYOUTS_SOURCE,
        modelOutput: newLayouts,
        expectedUnsourced: [],
    },
    {
        id: 'section-layout',
        purpose: 'Section divider slides: purple accent background, centered title, optional subtitle',
        source: ROADMAP_SOURCE,
        modelOutput: roadmapSectionDeck,
        expectedUnsourced: [],
    },
    {
        id: 'two-column-layout',
        purpose: 'Two-column comparison slides: equal bullet columns with shared title, sub-bullets',
        source: COMPARISON_SOURCE,
        modelOutput: twoColumnDeck,
        expectedUnsourced: [],
    },
    {
        id: 'quote-layout',
        purpose: 'Quote slides: large centered pull-quote, bottom-anchored attribution, no header',
        source: QUOTES_SOURCE,
        modelOutput: quoteDeck,
        expectedUnsourced: [],
    },
    {
        id: 'all-layouts',
        purpose: 'All six layout types in one deck: title, section, chart, two-column, bullets, quote',
        source: ALL_LAYOUTS_SOURCE,
        modelOutput: allLayoutsDeck,
        expectedUnsourced: [],
    },
];
