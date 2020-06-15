import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import { NotificationModel } from '../../src/app/interfaces/NotificationModel';
import { sortNotifications } from '../../src/app/containers/calendar/sortNotifications';

import { NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../../src/app/constants';

describe('sortNotifications()', () => {
    test('sorts case 1 correctly', () => {
        const a = {
            unit: NOTIFICATION_UNITS.MINUTES,
            type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.AFTER,
            value: 0,
            isAllDay: false,
        };
        const b = {
            unit: NOTIFICATION_UNITS.HOURS,
            type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            value: 1,
            isAllDay: false,
        };
        const c = {
            unit: NOTIFICATION_UNITS.HOURS,
            type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            value: 1,
            isAllDay: false,
        };
        const d = {
            unit: NOTIFICATION_UNITS.MINUTES,
            type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            value: 60,
            isAllDay: false,
        };
        const input = [a, b, c, d] as NotificationModel[];
        const expectedResult = [b, c, d, a];
        expect(sortNotifications(input)).toEqual(expectedResult);
    });

    test('sorts case 2 correctly', () => {
        const a = {
            unit: NOTIFICATION_UNITS.DAY,
            type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.AFTER,
            at: new Date(2000, 0, 1, 12, 30),
            value: 1,
            isAllDay: true,
        };

        const b = {
            unit: NOTIFICATION_UNITS.DAY,
            type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 1, 30),
            value: 1,
            isAllDay: true,
        };

        const c = {
            unit: NOTIFICATION_UNITS.DAY,
            type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 9, 30),
            value: 1,
            isAllDay: true,
        };

        const d = {
            unit: NOTIFICATION_UNITS.DAY,
            type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 9, 30),
            value: 7,
            isAllDay: true,
        };

        const e = {
            unit: NOTIFICATION_UNITS.WEEK,
            type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 9, 30),
            value: 1,
            isAllDay: true,
        };

        const input = [a, b, c, d, e] as NotificationModel[];
        const expectedResult = [d, e, b, c, a];

        expect(sortNotifications(input)).toEqual(expectedResult);
    });
});
