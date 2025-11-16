export interface ProjectCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
}

export const PROJECT_CATEGORIES: ProjectCategory[] = [
    { id: 'investing', name: 'Investing', icon: 'money-bills', color: 'rgba(16, 185, 129, 0.3)' }, // Emerald
    { id: 'homework', name: 'Homework', icon: 'pass-atom', color: 'rgba(59, 130, 246, 0.3)' }, // Blue
    { id: 'writing', name: 'Writing', icon: 'pen', color: 'rgba(168, 85, 247, 0.3)' }, // Purple
    { id: 'health', name: 'Health', icon: 'heart', color: 'rgba(239, 68, 68, 0.3)' }, // Red
    { id: 'legal', name: 'Legal', icon: 'file-lines', color: 'rgba(99, 102, 241, 0.3)' }, // Indigo
    { id: 'research', name: 'Research', icon: 'lightbulb', color: 'rgba(139, 92, 246, 0.3)' }, // Violet
    { id: 'finance', name: 'Finance', icon: 'money-bills', color: 'rgba(52, 168, 134, 0.3)' }, // Teal
    { id: 'work', name: 'Work', icon: 'pass-work', color: 'rgba(107, 114, 128, 0.3)' }, // Gray
    { id: 'personal', name: 'Personal', icon: 'user', color: 'rgba(236, 72, 153, 0.3)' }, // Pink
    { id: 'coding', name: 'Coding', icon: 'code', color: 'rgba(20, 184, 166, 0.3)' }, // Cyan
    { id: 'other', name: 'Other', icon: 'folder', color: 'rgba(99, 102, 241, 0.3)' }, // Indigo
];

export const DEFAULT_PROJECT_ICON = 'folder';
export const DEFAULT_PROJECT_COLOR = '#6366F1';

export function getProjectCategory(iconId?: string): ProjectCategory {
    return PROJECT_CATEGORIES.find((cat) => cat.id === iconId) || PROJECT_CATEGORIES[PROJECT_CATEGORIES.length - 1];
}

