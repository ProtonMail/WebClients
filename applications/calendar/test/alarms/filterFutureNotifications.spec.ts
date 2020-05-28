import { SETTINGS_NOTIFICATION_TYPE } from 'proton-shared/lib/interfaces/calendar';
import { NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../../src/app/constants';
import { filterFutureNotifications } from '../../src/app/helpers/notifications';

describe('filterFutureNotifications', () => {
    test('it should filter future part-day notifications', () => {
        const isAllDay = false;
        const atSameTimeNotifications = [
            {
                unit: NOTIFICATION_UNITS.MINUTES,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.AFTER,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.AFTER,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 0,
                isAllDay,
            },
        ];
        const beforeNotifications = [
            {
                unit: NOTIFICATION_UNITS.MINUTES,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 1,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 2,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 1,
                isAllDay,
            },
        ];
        const afterNotifications = [
            {
                unit: NOTIFICATION_UNITS.MINUTES,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.MINUTES,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                value: 1,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.AFTER,
                value: 2,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                value: 1,
                isAllDay,
            },
        ];
        const notifications = [...beforeNotifications, ...atSameTimeNotifications, ...afterNotifications];
        const expected = [...beforeNotifications, ...atSameTimeNotifications];
        expect(filterFutureNotifications(notifications)).toEqual(expected);
    });

    test('it should filter future all-day notifications', () => {
        const isAllDay = true;
        const onSameDayNotifications = [
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.AFTER,
                value: 0,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 0,
                isAllDay,
            },
        ];
        const beforeNotifications = [
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 1,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 2,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.BEFORE,
                value: 1,
                isAllDay,
            },
        ];
        const afterNotifications = [
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.DAY,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                value: 1,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                when: NOTIFICATION_WHEN.AFTER,
                value: 2,
                isAllDay,
            },
            {
                unit: NOTIFICATION_UNITS.WEEK,
                type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                when: NOTIFICATION_WHEN.AFTER,
                value: 1,
                isAllDay,
            },
        ];
        const notifications = [...beforeNotifications, ...onSameDayNotifications, ...afterNotifications];
        const expected = [...beforeNotifications, ...onSameDayNotifications];
        expect(filterFutureNotifications(notifications)).toEqual(expected);
    });
});
