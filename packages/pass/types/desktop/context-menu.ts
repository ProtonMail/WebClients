/** NOTE: electron is used as transient monorepo dependency */
import type { MenuItemConstructorOptions } from 'electron';

export type ContextMenuItem = {
    id?: string;
    label?: string;
    role?: MenuItemConstructorOptions['role'];
    type?: MenuItemConstructorOptions['type'];
    onSelected?: () => Promise<void> | void;
};

export type ContextMenuItemSerializable = Omit<ContextMenuItem, 'onSelected'>;
