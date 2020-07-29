export type NotificationType = 'error' | 'warning' | 'info' | 'success';

export interface NotificationOptions {
    id: number;
    text: React.ReactNode;
    type: NotificationType;
    isClosing: boolean;
    disableAutoClose?: boolean;
}

export interface CreateNotificationOptions extends Omit<NotificationOptions, 'id' | 'type' | 'isClosing'> {
    id?: number;
    type?: NotificationType;
    isClosing?: boolean;
    expiration?: number;
}
