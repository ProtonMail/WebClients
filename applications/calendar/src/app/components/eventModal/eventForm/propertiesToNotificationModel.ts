import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import { VcalValarmComponent, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { filterFutureNotifications } from '../../../helpers/alarms';
import { triggerToModel } from './notificationModel';
import { NotificationModel } from '../../../interfaces/NotificationModel';

export const propertiesToNotificationModel = (
    { components = [] }: Partial<VcalVeventComponent> = {},
    isAllDay: boolean
): NotificationModel[] => {
    const modelNotifications = components
        .filter(({ component }) => component === 'valarm')
        .map(({ trigger, action }: VcalValarmComponent) => {
            const type =
                action?.value?.toLowerCase() === 'email'
                    ? SETTINGS_NOTIFICATION_TYPE.EMAIL
                    : SETTINGS_NOTIFICATION_TYPE.DEVICE;
            return triggerToModel({
                trigger: trigger ? trigger.value : {},
                type,
                isAllDay,
            });
        });
    // Filter out future alarms
    return filterFutureNotifications(modelNotifications);
};
