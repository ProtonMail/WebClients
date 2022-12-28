import { Key, ReactNode } from 'react';

import { IconName } from '@proton/components/components';

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface NotificationOffset {
    y?: number;
    x?: number;
}

export interface NotificationOptions {
    id: number;
    key: Key;
    text: ReactNode;
    type: NotificationType;
    isClosing: boolean;
    showCloseButton?: boolean;
    icon?: IconName;
    deduplicate?: boolean;
}

export interface CreateNotificationOptions
    extends Omit<NotificationOptions, 'id' | 'type' | 'isClosing' | 'key' | 'showCloseButton' | 'icon'> {
    id?: number;
    key?: Key;
    type?: NotificationType;
    isClosing?: boolean;
    showCloseButton?: boolean;
    icon?: IconName;
    expiration?: number;
}

export interface CustomNotificationProps {
    onClose?: () => void;
}

export interface NotificationContextProps {
    type: NotificationType;
}
