import { c } from 'ttag';

export interface ProjectCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
}

// Available icons for project icon picker (validated against @proton/icons)
export const PROJECT_ICONS: string[] = [
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
];

export const DEFAULT_PROJECT_ICON = 'folder';
export const DEFAULT_PROJECT_COLOR = '#6D4AFF';

// Icon heuristics: map keywords to icons
const ICON_KEYWORDS: Record<string, string[]> = {
    folder: ['folder', 'files', 'documents', 'organize'],
    'file-lines': ['document', 'paper', 'report', 'legal', 'contract'],
    'pass-shop': ['shop', 'shopping', 'store', 'market', 'mall', 'department store', 'retail'],
    'pass-atom': ['homework', 'study', 'learn', 'education', 'knowledge'],
    'pen-sparks': [
        'ai',
        'magic',
        'creative',
        'ideas',
        'brainstorm',
        'write',
        'writing',
        'draft',
        'notes',
        'blog',
        'article',
        'essay',
    ],
    'money-bills': ['money', 'finance', 'investing', 'budget', 'expense', 'salary', 'income', 'bank', 'financial'],
    code: [
        'code',
        'coding',
        'programming',
        'developer',
        'software',
        'app',
        'web',
        'javascript',
        'python',
        'react',
        'terminal',
    ],
    'pass-pacman': ['pacman', 'game', 'play', 'entertainment', 'playstation', 'xbox', 'gaming'],
    'pass-basketball': [
        'football',
        'soccer',
        'basketball',
        'tennis',
        'golf',
        'baseball',
        'hockey',
        'cricket',
        'rugby',
        'volleyball',
        'boxing',
        'wrestling',
        'mma',
        'ufc',
    ],
    language: ['language', 'translate', 'chinese', 'spanish', 'french', 'german', 'japanese', 'korean', 'learn'],
    heart: ['love', 'fit', 'favorite', 'wedding', 'relationship', 'dating', 'personal', 'health', 'wellness'],
    'paint-roller': ['design', 'art', 'creative', 'painting', 'interior', 'decor', 'color'],
    sliders: ['settings', 'config', 'preferences', 'customize', 'tuning'],
    earth: ['travel', 'trip', 'vacation', 'holiday', 'world', 'international', 'geography'],
    lock: ['security', 'password', 'privacy', 'encryption', 'safe', 'protect'],
    mobile: ['mobile', 'phone', 'ios', 'android', 'smartphone'],
    tv: ['tv', 'movie', 'movies', 'film', 'video', 'streaming', 'netflix', 'youtube', 'entertainment'],
    fire: ['hot', 'trending', 'urgent', 'important', 'energy', 'startup'],
    'chart-line': ['analytics', 'metrics', 'stats', 'growth', 'tracking', 'performance', 'kpi', 'report'],
    buildings: ['office', 'company', 'business', 'corporate', 'career', 'real estate', 'property'],
    'pass-home': ['home', 'house', 'living', 'family', 'domestic'],
    lightbulb: ['research', 'innovation', 'think', 'concept'],
    'calendar-cells': ['calendar', 'plan', 'schedule', 'event', 'date'],
    'pass-fish': ['fish', 'food', 'restaurant', 'meal', 'dining', 'restaurant'],
    'pass-leaf': ['leaf', 'plant', 'tree', 'nature', 'forest', 'garden', 'vegan', 'vegetarian'],
    'pass-work': ['work', 'job', 'professional', 'career', 'employment'],
    'pass-gift': ['birthday', 'party', 'celebration', 'present', 'anniversary'],
    camera: ['photo', 'photography', 'picture', 'image', 'visual'],
    key: ['access', 'login', 'authentication', 'credentials'],
    sun: ['sun', 'sunny', 'weather', 'sunrise', 'sunset'],
    'pass-book': ['save', 'favorite', 'reading', 'books', 'library'],
};

/**
 * Get a suggested icon based on project name using keyword heuristics
 */
export function getIconFromProjectName(projectName: string): string {
    const nameLower = projectName.toLowerCase();

    for (const [icon, keywords] of Object.entries(ICON_KEYWORDS)) {
        for (const keyword of keywords) {
            if (nameLower.includes(keyword)) {
                return icon;
            }
        }
    }

    return DEFAULT_PROJECT_ICON;
}

/**
 * Get project category/icon info. Handles both:
 * - Legacy category IDs (e.g., 'investing', 'health')
 * - Direct icon names (e.g., 'money-bills', 'heart')
 */
export function getProjectCategory(iconId?: string): ProjectCategory {
    // Check if it's a direct icon name from our icon list
    if (iconId && PROJECT_ICONS.includes(iconId)) {
        return {
            id: iconId,
            name: iconId, // Use icon name as category name
            icon: iconId, // Icon name is the same as the ID
            color: DEFAULT_PROJECT_COLOR,
        };
    }

    // Fallback to default
    return {
        id: 'other',
        name: 'Other',
        icon: DEFAULT_PROJECT_ICON,
        color: DEFAULT_PROJECT_COLOR,
    };
}

// Map direct icon names to prompt categories for suggestions
const ICON_TO_PROMPT_CATEGORY: Record<string, string> = {
    'money-bills': 'finance',
    'chart-line': 'finance',
    heart: 'health',
    globe: 'planning',
    'calendar-cells': 'planning',
    pencil: 'writing',
    'pen-sparks': 'writing',
    code: 'coding',
    buildings: 'work',
    briefcase: 'work',
    lightbulb: 'research',
    'file-lines': 'legal',
};

/**
 * Get prompt suggestions for a project category or icon.
 * Returns an array of translatable prompt suggestions based on the category ID or icon name.
 */
export function getPromptSuggestionsForCategory(categoryOrIconId?: string): string[] {
    // If it's a direct icon name, map it to a category
    const categoryId = ICON_TO_PROMPT_CATEGORY[categoryOrIconId || ''] || categoryOrIconId;

    switch (categoryId) {
        case 'health':
            return [
                c('collider_2025:Prompt').t`What do these lab values mean and are any outside normal ranges?`,
                c('collider_2025:Prompt').t`Help me prepare questions about this diagnosis for my doctor`,
                c('collider_2025:Prompt').t`Explain this medication and its potential side effects`,
            ];
        case 'finance':
            return [
                c('collider_2025:Prompt')
                    .t`Help me understand different retirement account options and their tax implications`,
                c('collider_2025:Prompt').t`Explain the trade-offs between paying off debt vs investing`,
                c('collider_2025:Prompt').t`What should I know about emergency funds and where to keep them?`,
                c('collider_2025:Prompt').t`Analyze my spending patterns and suggest areas to reduce expenses`,
            ];
        case 'planning':
            return [
                c('collider_2025:Prompt').t`Help me plan a 2-week itinerary for Japan with cultural experiences`,
                c('collider_2025:Prompt').t`Create a packing list for a winter hiking trip in Patagonia`,
                c('collider_2025:Prompt').t`Suggest hidden gems and local favorites in Barcelona`,
            ];
        case 'investing':
            return [
                c('collider_2025:Prompt').t`What metrics and research should I review for this investment?`,
                c('collider_2025:Prompt').t`Explain the risks associated with this type of asset`,
                c('collider_2025:Prompt').t`Help me understand how to read and analyze financial statements`,
            ];
        case 'legal':
            return [
                c('collider_2025:Prompt').t`Summarize the key obligations and rights in this contract`,
                c('collider_2025:Prompt').t`What are the termination clauses and notice requirements?`,
                c('collider_2025:Prompt').t`Identify any unusual or potentially unfavorable terms`,
            ];
        case 'research':
            return [
                c('collider_2025:Prompt').t`Compare the methodologies used across these studies`,
                c('collider_2025:Prompt').t`What are the main findings and how do they relate to each other?`,
                c('collider_2025:Prompt').t`Identify research gaps and suggest future research directions`,
            ];
        case 'writing':
            return [
                c('collider_2025:Prompt').t`Help me refine this draft to be more concise and impactful`,
                c('collider_2025:Prompt').t`Suggest ways to improve the flow and structure of this text`,
                c('collider_2025:Prompt').t`Review this for clarity, tone, and grammatical errors`,
            ];
        case 'coding':
            return [
                c('collider_2025:Prompt').t`Review this code for bugs and potential improvements`,
                c('collider_2025:Prompt').t`Help me understand what this code does`,
                c('collider_2025:Prompt').t`Suggest ways to optimize this for better performance`,
            ];
        case 'homework':
            return [
                c('collider_2025:Prompt').t`Help me understand this concept step by step`,
                c('collider_2025:Prompt').t`Can you explain why this answer is correct?`,
                c('collider_2025:Prompt').t`What are the key points I should remember for this topic?`,
            ];
        case 'work':
            return [
                c('collider_2025:Prompt').t`Help me draft a professional response to this email`,
                c('collider_2025:Prompt').t`Summarize the key points from this meeting`,
                c('collider_2025:Prompt').t`Help me prepare talking points for this presentation`,
            ];
        case 'personal':
            return [
                c('collider_2025:Prompt').t`Help me organize my thoughts on this decision`,
                c('collider_2025:Prompt').t`What questions should I consider before making this choice?`,
                c('collider_2025:Prompt').t`Help me create a plan to achieve this goal`,
            ];
        default:
            return [];
    }
}
