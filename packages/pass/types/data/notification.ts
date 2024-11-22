import type { InAppNotificationCtaType, InAppNotificationDisplayType, MaybeNull } from '@proton/pass/types';

export enum NotificationState {
    UNREAD = 0,
    READ = 1,
    DISMISSED = 2,
}

type MessageCTA = {
    text: string;
    type: InAppNotificationCtaType;
    ref: string;
};

type MessageContent = {
    imageUrl: MaybeNull<string>;
    displayType: InAppNotificationDisplayType;
    title: string;
    message: string;
    theme: MaybeNull<string>;
    cta: MaybeNull<MessageCTA>;
};

export type InAppNotification = {
    id: string;
    notificationKey: string;
    startTime: number;
    endTime: MaybeNull<number>;
    state: NotificationState;
    content: MessageContent;
};

export type InAppNotifications = {
    notifications: InAppNotification[];
    total: number;
    lastId: MaybeNull<string>;
};

export type UpdateInAppNotificationDTO = Pick<InAppNotification, 'id' | 'state'>;
