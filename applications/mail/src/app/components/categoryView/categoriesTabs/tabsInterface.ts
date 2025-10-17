export type TabSize = 'default' | 'small' | 'tiny';

export enum TabState {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    DRAGGING_OVER = 'dragging-over',
    DRAGGING_NEIGHBOR = 'dragging-neighbor',
}

export const categoryColorClassName = 'mail-category-color' as const;
