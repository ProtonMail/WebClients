import { NotificationModel } from 'proton-shared/lib/interfaces/calendar';
import { VcalValarmComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { getValarmTrigger } from 'proton-shared/lib/calendar/getValarmTrigger';
import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/calendar/constants';

export const modelToValarmComponent = (notificationModel: NotificationModel): VcalValarmComponent => {
    return {
        component: 'valarm',
        trigger: {
            value: getValarmTrigger(notificationModel),
        },
        action: {
            value: notificationModel.type === SETTINGS_NOTIFICATION_TYPE.EMAIL ? 'EMAIL' : 'DISPLAY',
        },
    };
};
