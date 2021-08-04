import * as React from 'react';

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface NotificationOptions {
    id: number;
    key: any;
    text: React.ReactNode;
    type: NotificationType;
    isClosing: boolean;
    disableAutoClose?: boolean;
}

export interface CreateNotificationOptions extends Omit<NotificationOptions, 'id' | 'type' | 'isClosing' | 'key'> {
    id?: number;
    type?: NotificationType;
    isClosing?: boolean;
    expiration?: number;
}
