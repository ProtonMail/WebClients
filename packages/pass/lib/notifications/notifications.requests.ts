import { api } from '@proton/pass/lib/api/api';
import type { MaybeNull } from '@proton/pass/types';
import type { InAppNotifications, UpdateInAppNotificationDTO } from '@proton/pass/types/data/notification';
import { chainSort, sortOn } from '@proton/pass/utils/fp/sort';
import noop from '@proton/utils/noop';

export const getNotifications = async (): Promise<MaybeNull<InAppNotifications>> => {
    const { Notifications } = await api({ url: 'pass/v1/notification', method: 'get' });

    if (!Notifications) return null;

    return {
        notifications: Notifications.Notifications.map((notification) => ({
            id: notification.ID,
            notificationKey: notification.NotificationKey,
            startTime: notification.StartTime,
            endTime: notification.EndTime ?? null,
            state: notification.State,
            priority: notification.Priority,
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
            promoContents: notification.Content.PromoContents
                ? {
                      startMinimized: notification.Content.PromoContents.StartMinimized,
                      closePromoText: notification.Content.PromoContents.ClosePromoText,
                      minimizedPromoText: notification.Content.PromoContents.MinimizedPromoText,
                      light: {
                          backgroundImageUrl: notification.Content.PromoContents.LightThemeContents.BackgroundImageUrl,
                          contentImageUrl: notification.Content.PromoContents.LightThemeContents.ContentImageUrl,
                          closePromoTextColor:
                              notification.Content.PromoContents.LightThemeContents.ClosePromoTextColor,
                      },
                      dark: {
                          backgroundImageUrl: notification.Content.PromoContents.DarkThemeContents.BackgroundImageUrl,
                          contentImageUrl: notification.Content.PromoContents.DarkThemeContents.ContentImageUrl,
                          closePromoTextColor: notification.Content.PromoContents.DarkThemeContents.ClosePromoTextColor,
                      },
                  }
                : null,
        })).sort(chainSort(sortOn('priority', 'DESC'), sortOn('startTime', 'ASC'))),
        lastId: Notifications.LastID ?? null,
        total: Notifications.Total,
    };
};

export const updateNotificationState = async ({
    id,
    state,
}: UpdateInAppNotificationDTO): Promise<UpdateInAppNotificationDTO> =>
    api({ url: `pass/v1/notification/${id}`, method: 'put', data: { State: state } })
        .catch(noop)
        .then(() => ({ id, state }));
