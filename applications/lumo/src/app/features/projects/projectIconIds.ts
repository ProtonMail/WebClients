// Available icons for project icon picker (validated against @proton/icons).
// Kept separate from constants.ts to avoid circular imports with projectIconMapping.ts.
export const PROJECT_ICONS = [
    // Work & Productivity
    'folder',
    'file-lines',
    'calendar-cells',
    'pass-work',
    'presentation-screen',

    // Development & Tech
    'code',
    'window-terminal',
    'users-merge',
    'robot',
    'rocket',
    'bolt',
    'wrench',

    // Design & Creative
    'palette',
    'pen-sparks',
    'camera',
    'pass-atom',

    // Finance & Commerce
    'bank',
    'wallet',
    'money-bills',
    'pass-shopping-cart',
    'pass-shop',

    // Communication & Media
    'mobile',
    'tv',
    'language',

    // Data & Analytics
    'chart-line',
    'lightbulb',

    // Nature & Living Things
    'earth',
    'pass-leaf',
    'pass-flower',
    'pass-fish',
    'pass-bear',
    'pass-cream',
    'sun',
    'fire',

    // Lifestyle & Personal
    'pass-home',
    'pass-heart',
    'pass-gift',
    'pass-book',
    'bookmark',

    // Recreation & Fun
    'pass-basketball',
    'pass-pacman',
] as const;

export type ProjectIconId = (typeof PROJECT_ICONS)[number];

export const DEFAULT_PROJECT_ICON: ProjectIconId = 'folder';
