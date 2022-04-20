import { Key, ReactNode } from 'react';

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface NotificationOptions {
    id: number;
    key: any;
    text: ReactNode;
    type: NotificationType;
    isClosing: boolean;
    disableAutoClose?: boolean;
    deduplicate?: boolean;
}

export interface CreateNotificationOptions extends Omit<NotificationOptions, 'id' | 'type' | 'isClosing' | 'key'> {
    id?: number;
    key?: Key;
    type?: NotificationType;
    isClosing?: boolean;
    expiration?: number;
}
