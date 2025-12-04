import { c } from 'ttag';

export interface ProjectCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export const PROJECT_CATEGORIES: ProjectCategory[] = [
    { id: 'investing', name: 'Investing', icon: 'money-bills', color: '#1DB767' }, 
    { id: 'homework', name: 'Homework', icon: 'pass-atom', color: '#FFAC2E' },
    { id: 'writing', name: 'Writing', icon: 'pen-sparks', color: '#625DF5' }, 
    { id: 'health', name: 'Health', icon: 'heart-filled', color: '#DD5DCC' },
    { id: 'planning', name: 'Planning', icon: 'calendar-cells', color: '#95a5a6' },
    { id: 'legal', name: 'Legal', icon: 'file-lines', color: '#1BA3FD' }, 
    { id: 'research', name: 'Research', icon: 'lightbulb', color: '#625DF5' },
    { id: 'finance', name: 'Finance', icon: 'money-bills', color: '#1DB767' },
    { id: 'work', name: 'Work', icon: 'pass-work', color: '#625DF5' }, 
    { id: 'personal', name: 'Personal', icon: 'user-filled', color: '#FFAC2E' }, 
    { id: 'coding', name: 'Coding', icon: 'code', color: '#1BA3FD' }, 
    { id: 'other', name: 'Other', icon: 'folder-filled', color: '#625DF5' },
];

export const DEFAULT_PROJECT_ICON = 'folder';
export const DEFAULT_PROJECT_COLOR = '#6D4AFF';

export function getProjectCategory(iconId?: string): ProjectCategory {
    return PROJECT_CATEGORIES.find((cat) => cat.id === iconId) || PROJECT_CATEGORIES[PROJECT_CATEGORIES.length - 1];
}

/**
 * Get prompt suggestions for a project category.
 * Returns an array of translatable prompt suggestions based on the category ID.
 */
export function getPromptSuggestionsForCategory(categoryId?: string): string[] {
    switch (categoryId) {
        case 'health':
            return [
                c('collider_2025:Prompt').t`What do these lab values mean and are any outside normal ranges?`,
                c('collider_2025:Prompt').t`Help me prepare questions about this diagnosis for my doctor`,
                c('collider_2025:Prompt').t`Explain this medication and its potential side effects`,
            ];
        case 'finance':
            return [
                c('collider_2025:Prompt').t`Help me understand different retirement account options and their tax implications`,
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

