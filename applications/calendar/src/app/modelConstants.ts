import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import { fromTriggerString } from 'proton-shared/lib/calendar/vcal';
import { triggerToModel } from './components/eventModal/eventForm/notificationModel';

export const DEFAULT_PART_DAY_NOTIFICATION = {
    id: '1',
    ...triggerToModel({
        isAllDay: false,
        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
        trigger: fromTriggerString('-PT15M'),
    }),
};

export const DEFAULT_FULL_DAY_NOTIFICATION = {
    id: '2',
    ...triggerToModel({
        isAllDay: true,
        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
        trigger: fromTriggerString('-PT15H'),
    }),
};
