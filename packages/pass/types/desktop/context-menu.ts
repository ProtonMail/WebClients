export interface ContextMenuItem {
    id?: string;
    label?: string;
    onSelected?: () => Promise<void> | void;
}

export type ContextMenuItemSerializable = Omit<ContextMenuItem, 'onSelected'>;
