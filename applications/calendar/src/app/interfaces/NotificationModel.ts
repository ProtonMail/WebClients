import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import { NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../constants';

export interface NotificationModel {
    unit: NOTIFICATION_UNITS;
    type: SETTINGS_NOTIFICATION_TYPE;
    when: NOTIFICATION_WHEN;
    value: number | string;
    at?: Date;
    isAllDay: boolean;
}
