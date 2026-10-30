import type { DriveDocument } from '../../../../types/documents';

/*
 * A small but realistic project knowledge base for retrieval tests: Drive files in folders,
 * uploads, two files with the same name in different folders, files that point to other files,
 * a handbook large enough to be chunked, and a second project with look-alike files that must
 * never leak into the first.
 */

export const PROJECT_SPACE = 'space-project';
export const OTHER_SPACE = 'space-other';

type CorpusFile = Pick<DriveDocument, 'id' | 'name' | 'content'> & { spaceId?: string; folderPath?: string };

const handbookSections = [
    ['Welcome', 'This handbook explains how we work, what you can expect from us and what we expect from you.'],
    ['Working hours', 'Core hours are 10:00 to 16:00. Outside core hours you organise your own schedule.'],
    ['Remote work', 'You can work from home up to four days a week. Tell your team lead which days.'],
    ['Equipment', 'Every employee receives a laptop, a monitor and a headset. Report broken equipment to IT.'],
    ['Expenses', 'Submit expenses within 30 days with a receipt. Expenses above 500 euros need approval first.'],
    ['Learning', 'Each employee can spend five days a year on courses and conferences of their choice.'],
    ['Performance reviews', 'Reviews happen twice a year, in April and October, with your team lead.'],
    ['Holidays', 'Full-time employees get 28 days of holiday per year, plus public holidays.'],
    ['Sick leave', 'Tell your team lead before 10:00 on the first day. From the fourth day a doctor note is needed.'],
    ['Parental leave', 'Parental leave is 16 weeks, fully paid, for every parent, and can be split into two blocks.'],
    ['Leaving the company', 'The notice period is one month in the first year and two months afterwards.'],
] as const;

/** About 25K tokens: above the 20K-token chunking threshold, with the parental leave policy near the end. */
const handbook = handbookSections
    .map(([title, policy], index) =>
        [
            `## ${index + 1}. ${title}`,
            policy,
            ...Array.from(
                { length: 35 },
                (_, paragraph) =>
                    `Section ${index + 1}, paragraph ${paragraph + 1}: these rules apply to all offices and contract types unless your contract says otherwise. Ask People Operations if anything here is unclear for your situation, and check the intranet for the latest version of each form.`
            ),
        ].join('\n\n')
    )
    .join('\n\n');

export const CORPUS: CorpusFile[] = [
    {
        id: 'vendor-index',
        name: 'Vendor index.md',
        folderPath: 'Drive/Operations',
        content:
            '# Vendor index\nEverything about the vendors we work with.\n- Signed terms: see "Supplier contracts 2026.pdf"\n- Current prices: pricing_sheet_v2.xlsx\n- Before working with Acme, complete the Acme onboarding checklist.docx',
    },
    {
        id: 'contracts',
        name: 'Supplier contracts 2026.pdf',
        folderPath: 'Drive/Legal',
        content:
            'Acme Ltd: payment net 60, renewal on 1 March, termination with 90 days notice.\nGlobex Corporation: payment net 30, renewal every January.',
    },
    {
        id: 'pricing',
        name: 'pricing_sheet_v2.xlsx',
        folderPath: 'Drive/Finance',
        content: 'Widgets: 4 EUR each. Gadgets: 12 EUR each. Volume discount of 8% above 1000 units.',
    },
    {
        id: 'pricing-old',
        name: 'pricing_sheet_v1.xlsx',
        folderPath: 'Drive/Finance/Archive',
        content: 'Widgets: 3.50 EUR each. Gadgets: 11 EUR each. Superseded.',
    },
    {
        id: 'onboarding',
        name: 'Acme onboarding checklist.docx',
        folderPath: 'Drive/Operations',
        content: 'Steps: sign the NDA, fill in the security questionnaire, send our VAT number, set up invoicing.',
    },
    {
        id: 'meeting-sep',
        name: 'Meeting notes 2026-09-14.md',
        folderPath: 'Drive/Meetings',
        content:
            'Attendees: Ana, Ben, Chloe.\nDecision: the launch moves to November because the certification audit is not finished.',
    },
    {
        id: 'meeting-oct',
        name: 'Meeting notes 2026-10-02.md',
        folderPath: 'Drive/Meetings',
        content: 'Hiring: we will hire two backend engineers this quarter. The budget for both roles is approved.',
    },
    {
        id: 'budget',
        name: 'Q3 Budget_final.xlsx',
        folderPath: 'Drive/Finance',
        content: 'Q3 budget. Marketing: 40,000 EUR. Travel: 12,000 EUR. Hardware: 8,000 EUR.',
    },
    {
        id: 'budget-old',
        name: 'Q3 Budget_final.xlsx',
        folderPath: 'Drive/Finance/Archive',
        content: 'Q3 budget draft from last year. Marketing: 30,000 EUR. Travel: 15,000 EUR.',
    },
    { id: 'handbook', name: 'Employee handbook.pdf', folderPath: 'Drive/People', content: handbook },
    {
        id: 'security',
        name: 'Security policy.md',
        folderPath: 'Drive/IT',
        content:
            'Two-factor authentication (2FA) is mandatory for all accounts. Laptops must use full-disk encryption.',
    },
    {
        id: 'incident',
        name: 'Incident report 2026-08.md',
        folderPath: 'Drive/IT',
        content:
            'Outage on 12 August, 47 minutes. Cause: an expired TLS certificate on the API gateway. Action: automate certificate renewal.',
    },
    {
        id: 'travel',
        name: 'Travel policy.md',
        folderPath: 'Drive/People',
        content: 'Economy class for flights under 6 hours. Hotels: at most 180 EUR per night.',
    },
    {
        id: 'roadmap',
        name: 'Product roadmap 2027.md',
        folderPath: 'Drive/Product',
        content: 'Planned for 2027: offline mode, shared workspaces and an API for partners. Release in Q2 2027.',
    },
    {
        id: 'feedback',
        name: 'Customer feedback summary.md',
        folderPath: 'Drive/Product',
        content: 'Top complaints: slow sync on large folders. Top requests: dark mode and keyboard shortcuts.',
    },
    {
        id: 'readme',
        name: 'README_projects.md',
        folderPath: 'Drive',
        content:
            'How this folder is organised. Plans live in Product roadmap 2027.md and research in Customer feedback summary.md.',
    },
    {
        id: 'invoice',
        name: 'invoice_0042.pdf',
        folderPath: 'Drive/Finance',
        content: 'Invoice 0042 from Globex Corporation. Amount due: 2,350 EUR by 15 November.',
    },
    {
        id: 'french-notes',
        name: 'Compte rendu formation.md',
        folderPath: 'Drive/People',
        content: 'Le budget de formation est de 5 000 euros par an et par personne.',
    },
    {
        id: 'notes',
        name: 'notes.md',
        folderPath: 'Drive',
        content: 'Call the plumber on Monday. Buy coffee for the office.',
    },
    {
        id: 'upload-interviews',
        name: 'Interview questions.txt',
        folderPath: 'Uploaded Files',
        content: 'Backend interview: design a rate limiter, explain database indexes, review a pull request.',
    },
    {
        id: 'other-contracts',
        name: 'Supplier contracts 2026.pdf',
        spaceId: OTHER_SPACE,
        folderPath: 'Drive/Legal',
        content: 'Initech: payment net 45, renewal on 1 June. Acme Ltd: payment net 15.',
    },
    {
        id: 'other-partnership',
        name: 'Initech partnership.md',
        spaceId: OTHER_SPACE,
        folderPath: 'Drive',
        content: 'Joint launch with Initech planned for May.',
    },
    {
        id: 'other-travel',
        name: 'Travel policy.md',
        spaceId: OTHER_SPACE,
        folderPath: 'Drive',
        content: 'Business class allowed for all flights. Hotels: at most 250 EUR per night.',
    },
];

export const toDriveDocuments = (files: CorpusFile[] = CORPUS): DriveDocument[] =>
    files.map(({ id, name, content, spaceId = PROJECT_SPACE, folderPath = 'Drive' }) => ({
        id,
        name,
        content,
        spaceId,
        folderPath,
        folderId: spaceId,
        mimeType: 'text/plain',
        size: content.length,
        modifiedTime: 0,
    }));

export type RetrievalCase = {
    /** What the user asks; the old path searches with this. */
    question: string;
    /** Keywords the model would send to search_knowledge for this question. */
    query: string;
    /** Files an answer needs. */
    expected: string[];
    /** Files only reachable by following a reference from a file the search finds. */
    viaReference?: string[];
    /** Keyword search can't find these yet; kept so an improvement shows up as a passing case. */
    knownGap?: string;
};

export const CASES: RetrievalCase[] = [
    { question: "What are Acme's payment terms?", query: 'Acme payment terms', expected: ['contracts'] },
    { question: 'How much can I spend on a hotel per night?', query: 'hotel per night', expected: ['travel'] },
    { question: 'Why was the launch postponed?', query: 'launch moves November', expected: ['meeting-sep'] },
    { question: 'How many engineers are we hiring?', query: 'hire engineers', expected: ['meeting-oct'] },
    { question: 'What caused the outage in August?', query: 'outage August cause', expected: ['incident'] },
    { question: 'Is two-factor authentication required?', query: 'two-factor authentication', expected: ['security'] },
    { question: 'What is the Q3 marketing budget?', query: 'Q3 marketing budget', expected: ['budget'] },
    { question: 'How long is parental leave?', query: 'parental leave', expected: ['handbook'] },
    { question: 'How much does a widget cost?', query: 'widgets price', expected: ['pricing'] },
    { question: 'What did customers complain about?', query: 'customer complaints', expected: ['feedback'] },
    {
        question: 'Which questions do we ask in backend interviews?',
        query: 'backend interview',
        expected: ['upload-interviews'],
    },
    {
        question: 'What do we have on our vendors?',
        query: 'vendors',
        expected: ['vendor-index'],
        viaReference: ['contracts', 'pricing', 'onboarding'],
    },
    {
        question: 'How is the project folder organised?',
        query: 'folder organised',
        expected: ['readme'],
        viaReference: ['roadmap', 'feedback'],
    },
    {
        question: 'What does one widget cost?',
        query: 'widget cost',
        expected: ['pricing'],
        knownGap: 'word forms: the file says "Widgets" and the index does not stem words',
    },
    {
        question: 'What do customers complain about most?',
        query: 'customers complain',
        expected: ['feedback'],
        knownGap: 'word forms: the file says "complaints" and the index does not stem words',
    },
    {
        question: 'What do we owe on the latest bill?',
        query: 'bill owe',
        expected: ['invoice'],
        knownGap: 'synonym: the file says "invoice" and "amount due"',
    },
    {
        question: 'What is the training allowance per person?',
        query: 'training allowance',
        expected: ['french-notes'],
        knownGap: 'language: the file is in French ("formation")',
    },
];
