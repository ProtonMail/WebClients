import type { IconName } from '../../components/LumoIcon/LumoIcon';
import { DEFAULT_PROJECT_ICON, PROJECT_ICONS } from './projectIconIds';

/**
 * Canonical Proton project icon ids → closest Lucide icon for LumoIcon.
 * Stored project/agent icon values stay as Proton ids; resolve at render time only.
 */
export const PROTON_PROJECT_ICON_TO_LUCIDE = {
    folder: 'Folder',
    'file-lines': 'FileText',
    'calendar-cells': 'Calendar',
    'pass-work': 'Briefcase',
    'presentation-screen': 'Presentation',

    code: 'CodeXml',
    'window-terminal': 'SquareTerminal',
    'users-merge': 'GitFork',
    robot: 'Bot',
    rocket: 'Rocket',
    bolt: 'Zap',
    wrench: 'Wrench',

    palette: 'Palette',
    'pen-sparks': 'WandSparkles',
    camera: 'Camera',
    'pass-atom': 'Atom',

    bank: 'Landmark',
    wallet: 'Wallet',
    'money-bills': 'Banknote',
    'pass-shopping-cart': 'ShoppingCart',
    'pass-shop': 'Store',

    mobile: 'Smartphone',
    tv: 'Tv',
    language: 'Languages',

    'chart-line': 'ChartLine',
    lightbulb: 'Lightbulb',

    earth: 'Globe',
    'pass-leaf': 'Leaf',
    'pass-flower': 'Flower2',
    'pass-fish': 'Fish',
    'pass-bear': 'Panda',
    'pass-cream': 'IceCreamCone',
    sun: 'Sun',
    fire: 'Flame',

    'pass-home': 'House',
    'pass-heart': 'Heart',
    'pass-gift': 'Gift',
    'pass-book': 'BookOpen',
    bookmark: 'Bookmark',

    'pass-basketball': 'Volleyball',
    'pass-pacman': 'Gamepad2',
} satisfies Record<string, IconName>;

/**
 * Legacy category ids and other historical values that may still be persisted
 * on spaces, agents, or example data. Map directly to Lucide without migration.
 */
export const LEGACY_PROJECT_ICON_TO_LUCIDE = {
    health: 'Heart',
    investing: 'TrendingUp',
    finance: 'Banknote',
    legal: 'Scale',
    planning: 'Globe',
    writing: 'PenLine',
    coding: 'Code',
    homework: 'GraduationCap',
    work: 'Briefcase',
    personal: 'User',
    research: 'Lightbulb',

    heart: 'Heart',
    globe: 'Globe',
    pencil: 'PenLine',
    buildings: 'Building2',
    briefcase: 'Briefcase',
    'paint-roller': 'Paintbrush',
    sliders: 'SlidersHorizontal',
    lock: 'Lock',
    key: 'Key',
} satisfies Record<string, IconName>;

/**
 * Optional aliases from legacy ids to canonical Proton ids used in PROJECT_ICONS.
 * Prefer direct Lucide mapping when the legacy id has no close Proton equivalent.
 */
export const LEGACY_PROJECT_ICON_ALIASES: Record<string, string> = {
    health: 'pass-heart',
    investing: 'money-bills',
    finance: 'money-bills',
    legal: 'file-lines',
    planning: 'earth',
    writing: 'pen-sparks',
    coding: 'code',
    homework: 'pass-atom',
    work: 'pass-work',
    personal: 'pass-heart',
    research: 'lightbulb',
    heart: 'pass-heart',
    globe: 'earth',
    pencil: 'pen-sparks',
    buildings: 'pass-work',
    briefcase: 'pass-work',
    'paint-roller': 'palette',
};

const DEFAULT_LUCIDE_ICON: IconName = 'Folder';

export const isCanonicalProjectIcon = (iconId: string): boolean => {
    return (PROJECT_ICONS as readonly string[]).includes(iconId);
};

export const isKnownProjectIcon = (iconId?: string): boolean => {
    if (!iconId) {
        return false;
    }

    return (
        isCanonicalProjectIcon(iconId) ||
        iconId in LEGACY_PROJECT_ICON_TO_LUCIDE ||
        iconId in LEGACY_PROJECT_ICON_ALIASES
    );
};

/**
 * Resolve any stored project/agent icon id to the canonical Proton id when possible.
 * Unknown values fall back to the default project icon.
 */
export const normalizeProjectIconId = (iconId?: string): string => {
    if (!iconId) {
        return DEFAULT_PROJECT_ICON;
    }

    if (isCanonicalProjectIcon(iconId)) {
        return iconId;
    }

    if (LEGACY_PROJECT_ICON_ALIASES[iconId]) {
        return LEGACY_PROJECT_ICON_ALIASES[iconId];
    }

    return DEFAULT_PROJECT_ICON;
};

/**
 * Resolve any stored project/agent icon id to a Lucide icon name for LumoIcon.
 */
export const getProjectLucideIcon = (iconId?: string): IconName => {
    if (!iconId) {
        return DEFAULT_LUCIDE_ICON;
    }

    if (iconId in LEGACY_PROJECT_ICON_TO_LUCIDE) {
        return LEGACY_PROJECT_ICON_TO_LUCIDE[iconId as keyof typeof LEGACY_PROJECT_ICON_TO_LUCIDE] as IconName;
    }

    const normalizedId = normalizeProjectIconId(iconId);
    const mappedIcon = PROTON_PROJECT_ICON_TO_LUCIDE[normalizedId as keyof typeof PROTON_PROJECT_ICON_TO_LUCIDE];

    return (mappedIcon ?? DEFAULT_LUCIDE_ICON) as IconName;
};
