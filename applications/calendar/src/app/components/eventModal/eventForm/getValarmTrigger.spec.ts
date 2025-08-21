import { getValarmTrigger } from '@proton/shared/lib/calendar/alarms/getValarmTrigger';
import { NOTIFICATION_TYPE_API, NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '@proton/shared/lib/calendar/constants';
import { toTriggerString } from '@proton/shared/lib/calendar/vcal';

describe('model to properties positive trigger', () => {
    test('0 minutes before', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: false,
                    value: 0,
                    unit: NOTIFICATION_UNITS.MINUTE,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                })
            )
        ).toEqual('PT0S');
    });

    test('1 minute after', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: false,
                    value: 1,
                    unit: NOTIFICATION_UNITS.MINUTE,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.AFTER,
                })
            )
        ).toEqual('PT1M');
    });

    test('same day at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 0,
                    unit: NOTIFICATION_UNITS.DAY,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.AFTER,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('PT13H50M');
    });

    test('1 day after at 00:00', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 1,
                    unit: NOTIFICATION_UNITS.DAY,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.AFTER,
                    at: new Date(2000, 0, 1, 0, 0),
                })
            )
        ).toEqual('P1D');
    });

    test('1 day after at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 1,
                    unit: NOTIFICATION_UNITS.DAY,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.AFTER,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('P1DT13H50M');
    });

    test('1 week after at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 1,
                    unit: NOTIFICATION_UNITS.WEEK,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.AFTER,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('P1WT13H50M');
    });
});

describe('model to properties negative trigger', () => {
    test('1 day before at 00:00', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 1,
                    unit: NOTIFICATION_UNITS.DAY,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                    at: new Date(2000, 0, 1, 0, 0),
                })
            )
        ).toEqual('-P1D');
    });

    test('1 day before at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 1,
                    unit: NOTIFICATION_UNITS.DAY,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('-PT10H10M');
    });

    test('2 days before at 00:00', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 2,
                    unit: NOTIFICATION_UNITS.DAY,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                    at: new Date(2000, 0, 1, 0, 0),
                })
            )
        ).toEqual('-P2D');
    });

    test('2 days before at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 2,
                    unit: NOTIFICATION_UNITS.DAY,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('-P1DT10H10M');
    });

    test('0 weeks before at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 0,
                    unit: NOTIFICATION_UNITS.WEEK,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('-PT10H10M');
    });

    test('1 week before at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 1,
                    unit: NOTIFICATION_UNITS.WEEK,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('-P6DT10H10M');
    });

    test('2 weeks before at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 2,
                    unit: NOTIFICATION_UNITS.WEEK,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('-P1W6DT10H10M');
    });

    test('1 week before at 00:00', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 1,
                    unit: NOTIFICATION_UNITS.WEEK,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                    at: new Date(2000, 0, 1, 0, 0),
                })
            )
        ).toEqual('-P1W');
    });

    test('2 weeks before at 00:00', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: true,
                    value: 2,
                    unit: NOTIFICATION_UNITS.WEEK,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                    at: new Date(2000, 0, 1, 0, 0),
                })
            )
        ).toEqual('-P2W');
    });

    test('2 weeks before', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: false,
                    value: 2,
                    unit: NOTIFICATION_UNITS.WEEK,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                })
            )
        ).toEqual('-P2W');
    });

    test('15 minutes before', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: false,
                    value: 15,
                    unit: NOTIFICATION_UNITS.MINUTE,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                })
            )
        ).toEqual('-PT15M');
    });

    test('1 hour before', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    id: '1',
                    isAllDay: false,
                    value: 1,
                    unit: NOTIFICATION_UNITS.HOUR,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    when: NOTIFICATION_WHEN.BEFORE,
                })
            )
        ).toEqual('-PT1H');
    });
});
