import { getValarmTrigger } from '@proton/shared/lib/calendar/alarms/getValarmTrigger';
import { ICAL_ALARM_ACTION, NOTIFICATION_TYPE_API } from '@proton/shared/lib/calendar/constants';
import { NotificationModel } from '@proton/shared/lib/interfaces/calendar';
import { VcalValarmComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

export const modelToValarmComponent = (notificationModel: NotificationModel): VcalValarmComponent => {
    return {
        component: 'valarm',
        trigger: {
            value: getValarmTrigger(notificationModel),
        },
        action: {
            value:
                notificationModel.type === NOTIFICATION_TYPE_API.EMAIL
                    ? ICAL_ALARM_ACTION.EMAIL
                    : ICAL_ALARM_ACTION.DISPLAY,
        },
    };
};
