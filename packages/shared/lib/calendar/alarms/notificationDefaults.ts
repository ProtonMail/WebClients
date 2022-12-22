import { NOTIFICATION_TYPE_API } from '../constants';
import { fromTriggerString } from '../vcal';
import { triggerToModel } from './notificationModel';

export const DEFAULT_PART_DAY_NOTIFICATIONS = [
    {
        Type: NOTIFICATION_TYPE_API.DEVICE,
        Trigger: '-PT15M',
    },
    {
        Type: NOTIFICATION_TYPE_API.EMAIL,
        Trigger: '-PT15M',
    },
];

export const DEFAULT_FULL_DAY_NOTIFICATIONS = [
    {
        Type: NOTIFICATION_TYPE_API.DEVICE,
        Trigger: '-PT15H',
    },
    {
        Type: NOTIFICATION_TYPE_API.EMAIL,
        Trigger: '-PT15H',
    },
];

export const DEFAULT_PART_DAY_NOTIFICATION = {
    id: '1',
    ...triggerToModel({
        isAllDay: false,
        type: NOTIFICATION_TYPE_API.DEVICE,
        trigger: fromTriggerString('-PT15M'),
    }),
};

export const DEFAULT_FULL_DAY_NOTIFICATION = {
    id: '2',
    ...triggerToModel({
        isAllDay: true,
        type: NOTIFICATION_TYPE_API.DEVICE,
        trigger: fromTriggerString('-PT15H'),
    }),
};
