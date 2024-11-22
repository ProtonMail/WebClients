import { api } from '@proton/pass/lib/api/api';
import type { MaybeNull } from '@proton/pass/types';
import type { UserInAppNotifications } from '@proton/pass/types/data/notification';

export const getNotifications = async (): Promise<MaybeNull<UserInAppNotifications>> => {
    const { Notifications } = await api({ url: 'pass/v1/notification', method: 'get' });

    if (!Notifications) return null;

    return {
        notifications: Notifications.Notifications.map((notification) => ({
            id: notification.ID,
            notificationKey: notification.NotificationKey,
            startTime: notification.StartTime,
            endTime: notification.EndTime ?? null,
            state: notification.State,
            content: {
                imageUrl: notification.Content.ImageUrl ?? null,
                displayType: notification.Content.DisplayType,
                title: notification.Content.Title,
                message: notification.Content.Message,
                theme: notification.Content.Theme ?? null,
                cta: notification.Content.Cta
                    ? {
                          text: notification.Content.Cta.Text,
                          type: notification.Content.Cta.Type,
                          ref: notification.Content.Cta.Ref,
                      }
                    : null,
            },
        })),
        lastId: Notifications.LastID ?? null,
        total: Notifications.Total,
    };
};
