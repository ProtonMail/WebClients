import { NOTIFICATION_UNITS, NOTIFICATION_WHEN, SETTINGS_NOTIFICATION_TYPE } from '../../calendar/constants';

export interface NotificationModel {
    id: string;
    unit: NOTIFICATION_UNITS;
    type: SETTINGS_NOTIFICATION_TYPE;
    when: NOTIFICATION_WHEN;
    value?: number;
    at?: Date;
    isAllDay: boolean;
}
