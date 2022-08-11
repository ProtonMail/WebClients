import {
    NOTIFICATION_UNITS,
    NOTIFICATION_WHEN,
    SETTINGS_NOTIFICATION_TYPE,
} from '@proton/shared/lib/calendar/constants';
import { triggerToModel } from '@proton/shared/lib/calendar/notificationModel';
import { fromTriggerString } from '@proton/shared/lib/calendar/vcal';

const { DEVICE } = SETTINGS_NOTIFICATION_TYPE;
const { WEEK, DAY, HOUR, MINUTE } = NOTIFICATION_UNITS;
const { AFTER, BEFORE } = NOTIFICATION_WHEN;

describe('properties to model positive trigger', () => {
    test('part day 0', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: DEVICE,
                trigger: fromTriggerString('PT0S'),
            })
        ).toEqual({
            isAllDay: false,
            value: 0,
            unit: MINUTE,
            type: DEVICE,
            when: AFTER,
        });
    });

    test('part day trigger 1 minute', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: DEVICE,
                trigger: fromTriggerString('PT1M'),
            })
        ).toEqual({
            isAllDay: false,
            value: 1,
            unit: MINUTE,
            type: DEVICE,
            when: AFTER,
        });
    });

    test('all day trigger at 10:01 on the same day', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('PT10H1M'),
            })
        ).toEqual({
            isAllDay: true,
            value: 0,
            unit: DAY,
            type: DEVICE,
            when: AFTER,
            at: new Date(2000, 0, 1, 10, 1),
        });
    });

    test('all day trigger at 10:01 a day after', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('PT1D10H1M'),
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: DAY,
            type: DEVICE,
            when: AFTER,
            at: new Date(2000, 0, 1, 10, 1),
        });
    });

    test('all day trigger at 10:01 a week after', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('PT1W10H1M'),
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: WEEK,
            type: DEVICE,
            when: AFTER,
            at: new Date(2000, 0, 1, 10, 1),
        });
    });

    test('all day trigger at 10:01 a week and two days after', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('PT1W2D10H1M'),
            })
        ).toEqual({
            isAllDay: true,
            value: 9,
            unit: DAY,
            type: DEVICE,
            when: AFTER,
            at: new Date(2000, 0, 1, 10, 1),
        });
    });
});

describe('properties to model negative trigger', () => {
    test('part day notification 15 hours before', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: DEVICE,
                trigger: fromTriggerString('-PT15H'),
            })
        ).toEqual({
            isAllDay: false,
            value: 15,
            unit: HOUR,
            type: DEVICE,
            when: BEFORE,
        });
    });

    test('part day notification 1 day before', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: DEVICE,
                trigger: fromTriggerString('-PT1D'),
            })
        ).toEqual({
            isAllDay: false,
            value: 1,
            unit: DAY,
            type: DEVICE,
            when: BEFORE,
        });
    });

    test('part day notification 1 day and 15 hours before', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: DEVICE,
                trigger: fromTriggerString('-PT1D15H'),
            })
        ).toEqual({
            isAllDay: false,
            value: 39,
            unit: HOUR,
            type: DEVICE,
            when: BEFORE,
        });
    });

    test('part day notification 60 minutes before', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: DEVICE,
                trigger: fromTriggerString('-PT60M'),
            })
        ).toEqual({
            isAllDay: false,
            value: 60,
            unit: MINUTE,
            type: DEVICE,
            when: BEFORE,
        });
    });

    test('part day notification with two components 1 week minutes before', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: DEVICE,
                trigger: fromTriggerString('-PT24H6D'),
            })
        ).toEqual({
            isAllDay: false,
            value: 1,
            unit: WEEK,
            type: DEVICE,
            when: BEFORE,
        });
    });

    test('all day notification 1 day before at 00:00', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('-PT1D'),
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: DAY,
            type: DEVICE,
            when: BEFORE,
            at: new Date(2000, 0, 1, 0, 0),
        });
    });

    test('all day notification 1 day before at 13:50', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('-PT10H10M'),
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: DAY,
            type: DEVICE,
            when: BEFORE,
            at: new Date(2000, 0, 1, 13, 50),
        });
    });

    test('all day notification 1 week before at 00:00', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('-PT1W'),
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: WEEK,
            type: DEVICE,
            when: BEFORE,
            at: new Date(2000, 0, 1, 0, 0),
        });
    });

    test('all day notification 1 week and 6 days before', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('-PT1W6D'),
            })
        ).toEqual({
            isAllDay: true,
            value: 13,
            unit: DAY,
            type: DEVICE,
            when: BEFORE,
            at: new Date(2000, 0, 1, 0, 0),
        });
    });

    test('all day notification 1 week before at 13:50', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('-PT6D10H10M'),
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: WEEK,
            type: DEVICE,
            when: BEFORE,
            at: new Date(2000, 0, 1, 13, 50),
        });
    });

    test('all day notification 2 weeks before at 13:50', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('-PT1W6D10H10M'),
            })
        ).toEqual({
            isAllDay: true,
            value: 2,
            unit: WEEK,
            type: DEVICE,
            when: BEFORE,
            at: new Date(2000, 0, 1, 13, 50),
        });
    });

    test('all day notification 1 week and 6 days before at 13:50', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('-PT1W5D10H10M'),
            })
        ).toEqual({
            isAllDay: true,
            value: 13,
            unit: DAY,
            type: DEVICE,
            when: BEFORE,
            at: new Date(2000, 0, 1, 13, 50),
        });
    });

    test('all day notification 8 days before at 15:35 in two ways', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('-P1WT8H25M'),
            })
        ).toEqual({
            isAllDay: true,
            value: 8,
            unit: DAY,
            type: DEVICE,
            when: BEFORE,
            at: new Date(2000, 0, 1, 15, 35),
        });

        expect(
            triggerToModel({
                isAllDay: true,
                type: DEVICE,
                trigger: fromTriggerString('-P7DT8H25M'),
            })
        ).toEqual({
            isAllDay: true,
            value: 8,
            unit: DAY,
            type: DEVICE,
            when: BEFORE,
            at: new Date(2000, 0, 1, 15, 35),
        });
    });
});
