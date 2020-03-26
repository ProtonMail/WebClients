import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import { triggerToModel } from './notificationModel';
import { VcalValarmComponent } from '../../../interfaces/VcalModel';

export const propertiesToNotificationModel = ({ components = [] } = {}, isAllDay: boolean) => {
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
