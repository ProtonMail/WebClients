import type { SkillConnectorCategory } from './types';

/**
 * Lumo Desktop's connector categories, as in its catalog. Plugins name finer-grained kinds of tools
 * (Claude's `~~project tracker`, `~~knowledge base`, …); several of them land in one desktop category.
 */
export type DesktopConnectorCategory =
    | 'device'
    | 'communication'
    | 'files'
    | 'work'
    | 'support'
    | 'recruiting'
    | 'observability'
    | 'data'
    | 'developer'
    | 'compliance';

const DESKTOP_CATEGORY_BY_KIND: Record<string, DesktopConnectorCategory> = {
    'local files': 'device',
    filesystem: 'device',

    chat: 'communication',
    messaging: 'communication',
    email: 'communication',
    calendar: 'communication',
    meetings: 'communication',
    'video conferencing': 'communication',
    'conversation intelligence': 'communication',

    'cloud storage': 'files',
    'file storage': 'files',
    'document storage': 'files',
    files: 'files',
    storage: 'files',

    'project tracker': 'work',
    'project management': 'work',
    'knowledge base': 'work',
    wiki: 'work',
    docs: 'work',
    documents: 'work',
    design: 'work',
    'office suite': 'work',
    spreadsheet: 'work',

    'support platform': 'support',
    support: 'support',
    ticketing: 'support',
    'help desk': 'support',
    helpdesk: 'support',

    ats: 'recruiting',
    'applicant tracking': 'recruiting',
    recruiting: 'recruiting',

    monitoring: 'observability',
    observability: 'observability',
    logs: 'observability',
    logging: 'observability',
    apm: 'observability',
    alerting: 'observability',
    'incident management': 'observability',

    'data warehouse': 'data',
    database: 'data',
    notebook: 'data',
    'product analytics': 'data',
    analytics: 'data',
    bi: 'data',
    'business intelligence': 'data',

    'source control': 'developer',
    'version control': 'developer',
    'ci cd': 'developer',
    browser: 'developer',
    'browser automation': 'developer',

    compliance: 'compliance',
    screening: 'compliance',
    'risk intelligence': 'compliance',
    kyc: 'compliance',
};

const normalizeKind = (text: string) =>
    text
        .toLowerCase()
        .replace(/^~~/, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();

/** The desktop category a plugin's category falls in, or undefined when Lumo Desktop has none like it. */
export const getDesktopCategory = (
    category: Pick<SkillConnectorCategory, 'name' | 'placeholder'>
): DesktopConnectorCategory | undefined =>
    (category.placeholder && DESKTOP_CATEGORY_BY_KIND[normalizeKind(category.placeholder)]) ||
    DESKTOP_CATEGORY_BY_KIND[normalizeKind(category.name)];
