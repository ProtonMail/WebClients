import { generateUID } from '@proton/components';
import { filterFutureNotifications, sortNotificationsByAscendingTrigger } from '@proton/shared/lib/calendar/alarms';
import { SETTINGS_NOTIFICATION_TYPE } from '@proton/shared/lib/calendar/constants';
import { triggerToModel } from '@proton/shared/lib/calendar/notificationModel';
import { getIsAlarmComponent } from '@proton/shared/lib/calendar/vcalHelper';
import { NotificationModel } from '@proton/shared/lib/interfaces/calendar/Notification';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import unary from '@proton/utils/unary';

export const propertiesToNotificationModel = (
    { components = [] }: Partial<VcalVeventComponent> = {},
    isAllDay: boolean
): NotificationModel[] => {
    const modelNotifications = components.filter(unary(getIsAlarmComponent)).map(({ trigger, action }) => {
        const type =
            action?.value?.toLowerCase() === 'email'
                ? SETTINGS_NOTIFICATION_TYPE.EMAIL
                : SETTINGS_NOTIFICATION_TYPE.DEVICE;
        return {
            id: generateUID('notification'),
            ...triggerToModel({
                trigger: trigger ? trigger.value : {},
                type,
                isAllDay,
            }),
        };
    });
    // Filter out future alarms
    return sortNotificationsByAscendingTrigger(filterFutureNotifications(modelNotifications));
};
