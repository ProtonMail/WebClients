import { SETTINGS_NOTIFICATION_TYPE } from './constants';
import { triggerToModel } from './notificationModel';
import { fromTriggerString } from './vcal';

export const DEFAULT_PART_DAY_NOTIFICATIONS = [
    {
        Type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
        Trigger: '-PT15M',
    },
    {
        Type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
        Trigger: '-PT15M',
    },
];

export const DEFAULT_FULL_DAY_NOTIFICATIONS = [
    {
        Type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
        Trigger: '-PT15H',
    },
    {
        Type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
        Trigger: '-PT15H',
    },
];

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
