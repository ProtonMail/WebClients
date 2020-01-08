import { fromTriggerString } from 'proton-shared/lib/calendar/vcal';
import { triggerToModel } from '../../src/app/components/eventModal/eventForm/propertiesToModel';
import { NOTIFICATION_TYPE, NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../../src/app/constants';

describe('properties to model positive trigger', () => {
    test('part day 0 defaults to negative', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('PT0S')
            })
        ).toEqual({
            isAllDay: false,
            value: 0,
            unit: NOTIFICATION_UNITS.MINUTES,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE
        });
    });

    test('part day trigger 1 minute', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('PT1M')
            })
        ).toEqual({
            isAllDay: false,
            value: 1,
            unit: NOTIFICATION_UNITS.MINUTES,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.AFTER
        });
    });

    test('all day trigger at 10:01 on the same day', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('PT10H1M')
            })
        ).toEqual({
            isAllDay: true,
            value: 0,
            unit: NOTIFICATION_UNITS.DAY,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.AFTER,
            at: new Date(2000, 0, 1, 10, 1)
        });
    });

    test('all day trigger at 10:01 a day after', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('PT1D10H1M')
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: NOTIFICATION_UNITS.DAY,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.AFTER,
            at: new Date(2000, 0, 1, 10, 1)
        });
    });
});

describe('properties to model negative trigger', () => {
    test('part day notification 15 hours before', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('-PT15H')
            })
        ).toEqual({
            isAllDay: false,
            value: 15,
            unit: NOTIFICATION_UNITS.HOURS,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE
        });
    });

    test('part day notification 1 day before', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('-PT1D')
            })
        ).toEqual({
            isAllDay: false,
            value: 1,
            unit: NOTIFICATION_UNITS.DAY,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE
        });
    });

    test('part day notification 1 day before truncation', () => {
        expect(
            triggerToModel({
                isAllDay: false,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('-PT1D15H')
            })
        ).toEqual({
            isAllDay: false,
            value: 1,
            unit: NOTIFICATION_UNITS.DAY,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE
        });
    });

    test('all day notification 1 day before at 00:00', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('-PT1D')
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: NOTIFICATION_UNITS.DAY,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 0, 0)
        });
    });

    test('all day notification 1 day before at 13:50', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('-PT10H10M')
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: NOTIFICATION_UNITS.DAY,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 13, 50)
        });
    });

    test('all day notification 1 week before at 00:00', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('-PT1W')
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: NOTIFICATION_UNITS.WEEK,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 0, 0)
        });
    });

    test('all day notification 1 week before truncation', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('-PT1W6D')
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: NOTIFICATION_UNITS.WEEK,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 0, 0)
        });
    });

    test('all day notification 1 week before at 13:50', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('-PT6D10H10M')
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: NOTIFICATION_UNITS.WEEK,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 13, 50)
        });
    });

    test('all day notification 2 weeks before at 13:50', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('-PT1W6D10H10M')
            })
        ).toEqual({
            isAllDay: true,
            value: 2,
            unit: NOTIFICATION_UNITS.WEEK,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 13, 50)
        });
    });

    test('all day notification 1 week before at 13:50 truncation', () => {
        expect(
            triggerToModel({
                isAllDay: true,
                type: NOTIFICATION_TYPE.DEVICE,
                trigger: fromTriggerString('-PT1W5D10H10M')
            })
        ).toEqual({
            isAllDay: true,
            value: 1,
            unit: NOTIFICATION_UNITS.WEEK,
            type: NOTIFICATION_TYPE.DEVICE,
            when: NOTIFICATION_WHEN.BEFORE,
            at: new Date(2000, 0, 1, 13, 50)
        });
    });
});
