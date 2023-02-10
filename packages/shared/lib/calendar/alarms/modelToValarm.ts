import { NotificationModel } from '../../interfaces/calendar';
import { VcalValarmComponent } from '../../interfaces/calendar/VcalModel';
import { ICAL_ALARM_ACTION, NOTIFICATION_TYPE_API } from '../constants';
import { getValarmTrigger } from './getValarmTrigger';

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
