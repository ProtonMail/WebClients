import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import { triggerToModel } from './notificationModel';

export const propertiesToNotificationModel = ({ components = [] } = {}, isAllDay) => {
    return components
        .filter(({ component }) => component === 'valarm')
        .map(({ trigger, action }) => {
            const type =
                action && action.value.toLowerCase() === 'email'
                    ? SETTINGS_NOTIFICATION_TYPE.EMAIL
                    : SETTINGS_NOTIFICATION_TYPE.DEVICE;
            return triggerToModel({
                trigger: trigger ? trigger.value : {},
                type,
                isAllDay
            });
        });
};
