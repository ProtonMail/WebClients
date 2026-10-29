import { c } from 'ttag';

import { BRAND_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import {
    ATS,
    BROWSER,
    CHAT,
    CLOUD_STORAGE,
    DATA_WAREHOUSE,
    DESIGN_TOOL,
    EMAIL,
    INCIDENT_MANAGEMENT,
    KNOWLEDGE_BASE,
    LOCAL_FILES,
    MONITORING,
    PROJECT_TRACKER,
    SOURCE_CONTROL,
    SUPPORT_PLATFORM,
} from './protonPlugins/connectors';
import { DATA_SKILLS } from './protonPlugins/data';
import { DESIGN_SKILLS } from './protonPlugins/design';
import { ENGINEERING_SKILLS } from './protonPlugins/engineering';
import { FINANCE_SKILLS } from './protonPlugins/finance';
import { HUMAN_RESOURCES_SKILLS } from './protonPlugins/humanResources';
import { LEARNING_SKILLS } from './protonPlugins/learning';
import { MARKETING_SKILLS } from './protonPlugins/marketing';
import { PRESENTATIONS_SKILLS } from './protonPlugins/presentations';
import { PRIVACY_SKILLS } from './protonPlugins/privacy';
import { PRODUCT_MANAGEMENT_SKILLS } from './protonPlugins/productManagement';
import { PRODUCTIVITY_SKILLS } from './protonPlugins/productivity';
import { RESEARCH_SKILLS } from './protonPlugins/research';
import { SALES_SKILLS } from './protonPlugins/sales';
import { SMALL_BUSINESS_SKILLS } from './protonPlugins/smallBusiness';
import type { ProtonPluginConnector, ProtonPluginSkill } from './protonPlugins/types';
import { WRITING_SKILLS } from './protonPlugins/writing';
import { CONNECTORS_MARKDOWN_PATH, PLUGIN_MANIFEST_PATH, README_PATH } from './skillBundle';
import { encodeText, getSkillFileMimeType } from './skillFiles';
import { buildSkillMarkdown } from './skillMarkdown';
import { SKILL_MARKDOWN_PATH, type SkillDraft, type SkillFileDraft } from './types';

/**
 * Plugins published by Proton, offered under Customize → Discover. Adding one saves it as a regular plugin
 * (source `proton`) built from a manifest, a README and one SKILL.md per skill, keyed by `id` through
 * `legacyAgentId` so it is offered only once. Titles and descriptions follow the locale; skill files stay
 * in English because they are instructions for the model.
 */
export type ProtonPluginGroup = 'everyday' | 'work' | 'business';

/** Design-system colour the plugin's icon is tinted with on Discover. */
type ProtonPluginAccent = 'primary' | 'info' | 'success' | 'warning';

export type ProtonPlugin = {
    id: string;
    version: string;
    icon: string;
    accent: ProtonPluginAccent;
    group: ProtonPluginGroup;
    getTitle: () => string;
    getDescription: () => string;
    /** A request the plugin handles well, shown as an example on Discover. */
    getExample: () => string;
    skills: ProtonPluginSkill[];
    /** Kinds of tools the skills can use; matched against the user's Lumo Desktop connectors. */
    connectors: ProtonPluginConnector[];
};

const VERSION = '1.1.0';

export const getProtonPlugins = (): ProtonPlugin[] => [
    {
        id: 'proton-plugin-writing',
        version: VERSION,
        icon: 'pen-sparks',
        accent: 'primary',
        group: 'everyday',
        getExample: () => c('collider_2025:Plugin example').t`Reply to this email and politely say no`,
        getTitle: () => c('collider_2025:Plugin name').t`Writing`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Draft, edit, rephrase and translate emails, posts and documents in your own voice.`,
        skills: WRITING_SKILLS,
        connectors: [EMAIL, CLOUD_STORAGE],
    },
    {
        id: 'proton-plugin-research',
        version: VERSION,
        icon: 'earth',
        accent: 'info',
        group: 'work',
        getExample: () => c('collider_2025:Plugin example').t`Compare the three best e-readers under €200`,
        getTitle: () => c('collider_2025:Plugin name').t`Research`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Search the web and come back with sourced reports, fact-checks, comparisons and news briefs.`,
        skills: RESEARCH_SKILLS,
        connectors: [CLOUD_STORAGE, KNOWLEDGE_BASE],
    },
    {
        id: 'proton-plugin-data',
        version: VERSION,
        icon: 'chart-line',
        accent: 'success',
        group: 'work',
        getExample: () => c('collider_2025:Plugin example').t`Build a dashboard from this sales spreadsheet`,
        getTitle: () => c('collider_2025:Plugin name').t`Data`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Explore and clean spreadsheets, chart the results and build interactive dashboards.`,
        skills: DATA_SKILLS,
        connectors: [DATA_WAREHOUSE, CLOUD_STORAGE, LOCAL_FILES],
    },
    {
        id: 'proton-plugin-productivity',
        version: VERSION,
        icon: 'calendar-cells',
        accent: 'info',
        group: 'everyday',
        getExample: () => c('collider_2025:Plugin example').t`Turn these meeting notes into actions with owners`,
        getTitle: () => c('collider_2025:Plugin name').t`Productivity`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Turn meetings, inboxes and to-do lists into decisions, plans and replies.`,
        skills: PRODUCTIVITY_SKILLS,
        connectors: [EMAIL, CHAT, PROJECT_TRACKER, CLOUD_STORAGE],
    },
    {
        id: 'proton-plugin-presentations',
        version: VERSION,
        icon: 'presentation-screen',
        accent: 'warning',
        group: 'work',
        getExample: () => c('collider_2025:Plugin example').t`Turn this report into a ten-slide deck`,
        getTitle: () => c('collider_2025:Plugin name').t`Presentations`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Build slide decks, one-pagers, interactive explainers and illustrations.`,
        skills: PRESENTATIONS_SKILLS,
        connectors: [CLOUD_STORAGE, DESIGN_TOOL],
    },
    {
        id: 'proton-plugin-privacy',
        version: VERSION,
        icon: 'lock',
        accent: 'success',
        group: 'everyday',
        getExample: () => c('collider_2025:Plugin example').t`Is this email a phishing attempt?`,
        getTitle: () => c('collider_2025:Plugin name').t`Privacy and security`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Spot phishing, redact personal data, decode privacy policies and take back control of your data.`,
        skills: PRIVACY_SKILLS,
        connectors: [EMAIL],
    },
    {
        id: 'proton-plugin-learning',
        version: VERSION,
        icon: 'pass-book',
        accent: 'warning',
        group: 'everyday',
        getExample: () => c('collider_2025:Plugin example').t`Quiz me on the French Revolution`,
        getTitle: () => c('collider_2025:Plugin name').t`Learning`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Understand new topics, quiz yourself, make flashcards and plan your studies.`,
        skills: LEARNING_SKILLS,
        connectors: [CLOUD_STORAGE, LOCAL_FILES],
    },
    {
        id: 'proton-plugin-engineering',
        version: VERSION,
        icon: 'code',
        accent: 'primary',
        group: 'work',
        getExample: () => c('collider_2025:Plugin example').t`Review this diff for bugs and security issues`,
        getTitle: () => c('collider_2025:Plugin name').t`Engineering`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Review, debug, test and explain code, and write design docs. Reads your project on ${LUMO_SHORT_APP_NAME} Desktop.`,
        skills: ENGINEERING_SKILLS,
        connectors: [
            SOURCE_CONTROL,
            PROJECT_TRACKER,
            LOCAL_FILES,
            BROWSER,
            MONITORING,
            INCIDENT_MANAGEMENT,
            KNOWLEDGE_BASE,
        ],
    },
    {
        id: 'proton-plugin-design',
        version: VERSION,
        icon: 'palette',
        accent: 'info',
        group: 'work',
        getExample: () => c('collider_2025:Plugin example').t`Critique this checkout screen`,
        getTitle: () => c('collider_2025:Plugin name').t`Design`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Critique screens, check accessibility, write interface copy, hand off to developers and plan user research.`,
        skills: DESIGN_SKILLS,
        connectors: [DESIGN_TOOL, PROJECT_TRACKER, BROWSER, KNOWLEDGE_BASE],
    },
    {
        id: 'proton-plugin-small-business',
        version: VERSION,
        icon: 'pass-shop',
        accent: 'warning',
        group: 'business',
        getExample: () => c('collider_2025:Plugin example').t`Who owes me money? Here's my invoices export`,
        getTitle: () => c('collider_2025:Plugin name').t`Small business`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Chase invoices, forecast cash, write quotes, answer reviews, hire fairly and check contracts.`,
        skills: SMALL_BUSINESS_SKILLS,
        connectors: [EMAIL, CLOUD_STORAGE],
    },
    {
        id: 'proton-plugin-product-management',
        version: VERSION,
        icon: 'rocket',
        accent: 'primary',
        group: 'business',
        getExample: () => c('collider_2025:Plugin example').t`Write a spec for letting users export their data`,
        getTitle: () => c('collider_2025:Plugin name').t`Product management`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Write specs, synthesize research, size up competitors, plan roadmaps and report on progress.`,
        skills: PRODUCT_MANAGEMENT_SKILLS,
        connectors: [PROJECT_TRACKER, KNOWLEDGE_BASE, CHAT, DESIGN_TOOL, DATA_WAREHOUSE, SUPPORT_PLATFORM],
    },
    {
        id: 'proton-plugin-sales',
        version: VERSION,
        icon: 'pass-work',
        accent: 'success',
        group: 'business',
        getExample: () => c('collider_2025:Plugin example').t`Prep me for my call with Acme tomorrow`,
        getTitle: () => c('collider_2025:Plugin name').t`Sales`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Research accounts, prep calls, follow up, write outreach and handle objections.`,
        skills: SALES_SKILLS,
        connectors: [EMAIL, CHAT, CLOUD_STORAGE],
    },
    {
        id: 'proton-plugin-marketing',
        version: VERSION,
        icon: 'bolt',
        accent: 'info',
        group: 'business',
        getExample: () => c('collider_2025:Plugin example').t`Plan a launch campaign for our new app`,
        getTitle: () => c('collider_2025:Plugin name').t`Marketing`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Plan campaigns, write email sequences, audit your site for search and keep content on brand.`,
        skills: MARKETING_SKILLS,
        connectors: [EMAIL, CHAT, DESIGN_TOOL, CLOUD_STORAGE],
    },
    {
        id: 'proton-plugin-finance',
        version: VERSION,
        icon: 'bank',
        accent: 'primary',
        group: 'business',
        getExample: () => c('collider_2025:Plugin example').t`Why are we over budget this quarter?`,
        getTitle: () => c('collider_2025:Plugin name').t`Finance`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Explain variances, build financial statements, reconcile accounts and prepare journal entries.`,
        skills: FINANCE_SKILLS,
        connectors: [DATA_WAREHOUSE, CLOUD_STORAGE, LOCAL_FILES],
    },
    {
        id: 'proton-plugin-human-resources',
        version: VERSION,
        icon: 'pass-heart',
        accent: 'warning',
        group: 'business',
        getExample: () => c('collider_2025:Plugin example').t`Plan the first week for our new designer`,
        getTitle: () => c('collider_2025:Plugin name').t`People and HR`,
        getDescription: () =>
            c('collider_2025:Plugin description')
                .t`Onboard new hires, write fair reviews, answer policy questions and draft offer letters.`,
        skills: HUMAN_RESOURCES_SKILLS,
        connectors: [ATS, KNOWLEDGE_BASE, EMAIL, CHAT, CLOUD_STORAGE],
    },
];

const textFile = (path: string, text: string): SkillFileDraft => ({
    path,
    mimeType: getSkillFileMimeType(path),
    data: encodeText(text),
});

const buildReadme = (plugin: ProtonPlugin) =>
    [
        `# ${plugin.getTitle()}`,
        plugin.getDescription(),
        '## Skills',
        plugin.skills.map(({ name, description }) => `- **/${name}**: ${description}`).join('\n'),
    ].join('\n\n');

const buildConnectorsMarkdown = (plugin: ProtonPlugin) =>
    [
        '# Connectors',
        'Skills refer to kinds of tools by placeholder. Connect one in Lumo Desktop to let a skill use it.',
        [
            '| Category | Placeholder | Included servers | Other options |',
            '| --- | --- | --- | --- |',
            ...plugin.connectors.map(
                ({ category, placeholder, included, alternatives = [] }) =>
                    `| ${category} | \`${placeholder}\` | ${included.join(', ')} | ${alternatives.join(', ')} |`
            ),
        ].join('\n'),
    ].join('\n\n');

export const protonPluginToDraft = (plugin: ProtonPlugin): SkillDraft => ({
    name: plugin.getTitle(),
    description: plugin.getDescription(),
    instructions: '',
    icon: plugin.icon,
    source: 'proton',
    metadata: { author: BRAND_NAME },
    legacyAgentId: plugin.id,
    files: [
        textFile(
            PLUGIN_MANIFEST_PATH,
            JSON.stringify({ name: plugin.id, version: plugin.version, author: { name: BRAND_NAME } }, null, 2)
        ),
        textFile(README_PATH, buildReadme(plugin)),
        ...(plugin.connectors.length ? [textFile(CONNECTORS_MARKDOWN_PATH, buildConnectorsMarkdown(plugin))] : []),
        ...plugin.skills.map(({ name, description, instructions }) =>
            textFile(`skills/${name}/${SKILL_MARKDOWN_PATH}`, buildSkillMarkdown({ name, description, instructions }))
        ),
    ],
});

/** Whether a plugin matches a search, by its title, description or any of its skills. */
export const protonPluginMatches = (plugin: ProtonPlugin, query: string): boolean => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
        return true;
    }
    return [plugin.getTitle(), plugin.getDescription(), ...plugin.skills.flatMap((s) => [s.name, s.description])].some(
        (text) => text.toLowerCase().includes(normalized)
    );
};
