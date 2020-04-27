import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import { triggerToModel } from './notificationModel';
import { VcalValarmComponent, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

export const propertiesToNotificationModel = (
    { components = [] }: Partial<VcalVeventComponent> = {},
    isAllDay: boolean
) => {
    return components
        .filter(({ component }) => component === 'valarm')
        .map(({ trigger, action }: VcalValarmComponent) => {
            const type =
                action?.value?.toLowerCase() === 'email'
                    ? SETTINGS_NOTIFICATION_TYPE.EMAIL
                    : SETTINGS_NOTIFICATION_TYPE.DEVICE;
            return triggerToModel({
                trigger: trigger ? trigger.value : {},
                type,
                isAllDay
            });
        });
};
