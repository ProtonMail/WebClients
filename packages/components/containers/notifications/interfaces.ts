import type { Key, ReactNode } from 'react';

import { type IconName } from '@proton/components/components/icon/Icon';

export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface NotificationOffset {
    y?: number;
    x?: number;
}

export interface Notification {
    id: number;
    key: Key;
    text: ReactNode;
    type: NotificationType;
    isClosing: boolean;
    showCloseButton?: boolean;
    icon?: IconName;
    deduplicate?: boolean;
    duplicate: { old: Notification | undefined; state: 'init' | 'removed'; key: number };
}

export interface CreateNotificationOptions
    extends Pick<Notification, 'text' | 'icon' | 'showCloseButton' | 'deduplicate'> {
    id?: number;
    key?: Key;
    type?: NotificationType;
    isClosing?: boolean;
    expiration?: number;
}

export interface CustomNotificationProps {
    onClose?: () => void;
}

export interface NotificationContextProps {
    type: NotificationType;
}
