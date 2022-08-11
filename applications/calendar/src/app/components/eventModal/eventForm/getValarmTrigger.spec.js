import {
    NOTIFICATION_UNITS,
    NOTIFICATION_WHEN,
    SETTINGS_NOTIFICATION_TYPE,
} from '@proton/shared/lib/calendar/constants';
import { getValarmTrigger } from '@proton/shared/lib/calendar/getValarmTrigger';
import { toTriggerString } from '@proton/shared/lib/calendar/vcal';

const { DEVICE } = SETTINGS_NOTIFICATION_TYPE;
const { DAY, HOUR, WEEK, MINUTE } = NOTIFICATION_UNITS;
const { BEFORE, AFTER } = NOTIFICATION_WHEN;

describe('model to properties positive trigger', () => {
    test('0 minutes before', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: false,
                    value: 0,
                    unit: MINUTE,
                    type: DEVICE,
                    when: BEFORE,
                })
            )
        ).toEqual('PT0S');
    });

    test('1 minute after', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: false,
                    value: 1,
                    unit: MINUTE,
                    type: DEVICE,
                    when: AFTER,
                })
            )
        ).toEqual('PT1M');
    });

    test('same day at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 0,
                    unit: DAY,
                    type: DEVICE,
                    when: AFTER,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('PT13H50M');
    });

    test('1 day after at 00:00', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 1,
                    unit: DAY,
                    type: DEVICE,
                    when: AFTER,
                    at: new Date(2000, 0, 1, 0, 0),
                })
            )
        ).toEqual('P1D');
    });

    test('1 day after at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 1,
                    unit: DAY,
                    type: DEVICE,
                    when: AFTER,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('P1DT13H50M');
    });

    test('1 week after at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 1,
                    unit: WEEK,
                    type: DEVICE,
                    when: AFTER,
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
                    isAllDay: true,
                    value: 1,
                    unit: DAY,
                    type: DEVICE,
                    when: BEFORE,
                    at: new Date(2000, 0, 1, 0, 0),
                })
            )
        ).toEqual('-P1D');
    });

    test('1 day before at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 1,
                    unit: DAY,
                    type: DEVICE,
                    when: BEFORE,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('-PT10H10M');
    });

    test('2 days before at 00:00', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 2,
                    unit: DAY,
                    type: DEVICE,
                    when: BEFORE,
                    at: new Date(2000, 0, 1, 0, 0),
                })
            )
        ).toEqual('-P2D');
    });

    test('2 days before at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 2,
                    unit: DAY,
                    type: DEVICE,
                    when: BEFORE,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('-P1DT10H10M');
    });

    test('0 weeks before at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 0,
                    unit: WEEK,
                    type: DEVICE,
                    when: BEFORE,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('-PT10H10M');
    });

    test('1 week before at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 1,
                    unit: WEEK,
                    type: DEVICE,
                    when: BEFORE,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('-P6DT10H10M');
    });

    test('2 weeks before at 13:50', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 2,
                    unit: WEEK,
                    type: DEVICE,
                    when: BEFORE,
                    at: new Date(2000, 0, 1, 13, 50),
                })
            )
        ).toEqual('-P1W6DT10H10M');
    });

    test('1 week before at 00:00', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 1,
                    unit: WEEK,
                    type: DEVICE,
                    when: BEFORE,
                    at: new Date(2000, 0, 1, 0, 0),
                })
            )
        ).toEqual('-P1W');
    });

    test('2 weeks before at 00:00', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: true,
                    value: 2,
                    unit: WEEK,
                    type: DEVICE,
                    when: BEFORE,
                    at: new Date(2000, 0, 1, 0, 0),
                })
            )
        ).toEqual('-P2W');
    });

    test('2 weeks before', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: false,
                    value: 2,
                    unit: WEEK,
                    type: DEVICE,
                    when: BEFORE,
                })
            )
        ).toEqual('-P2W');
    });

    test('15 minutes before', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: false,
                    value: 15,
                    unit: MINUTE,
                    type: DEVICE,
                    when: BEFORE,
                })
            )
        ).toEqual('-PT15M');
    });

    test('1 hour before', () => {
        expect(
            toTriggerString(
                getValarmTrigger({
                    isAllDay: false,
                    value: 1,
                    unit: HOUR,
                    type: DEVICE,
                    when: BEFORE,
                })
            )
        ).toEqual('-PT1H');
    });
});
