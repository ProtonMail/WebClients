import type {
    InAppNotificationCtaType,
    InAppNotificationDisplayType,
    InAppNotificationState,
    MaybeNull,
} from '@proton/pass/types';

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

type ThemeContent = {
    backgroundImageUrl: string;
    contentImageUrl: string;
    closePromoTextColor: string;
};

type PromoContent = {
    startMinimized: boolean;
    closePromoText: string;
    minimizedPromoText: string;
    light: ThemeContent;
    dark: ThemeContent;
};

export type InAppNotification = {
    id: string;
    notificationKey: string;
    startTime: number;
    endTime: MaybeNull<number>;
    state: InAppNotificationState;
    content: MessageContent;
    priority: number;
    promoContents: MaybeNull<PromoContent>;
};

export type InAppNotifications = {
    notifications: InAppNotification[];
    total: number;
    lastId: MaybeNull<string>;
};

export type UpdateInAppNotificationDTO = Pick<InAppNotification, 'id' | 'state'>;

export type TelemetryInAppNotificationStatus = 'read' | 'unread' | 'dismissed';
