import { NOTIFICATION_TYPE_API, NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../../calendar/constants';

export interface NotificationModel {
    id: string;
    unit: NOTIFICATION_UNITS;
    type: NOTIFICATION_TYPE_API;
    when: NOTIFICATION_WHEN;
    value?: number;
    at?: Date;
    isAllDay: boolean;
}
