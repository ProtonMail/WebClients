import { modelToValarmComponent } from '../../../lib/calendar/alarms/modelToValarm';
import { NOTIFICATION_TYPE_API, NOTIFICATION_UNITS, NOTIFICATION_WHEN } from '../../../lib/calendar/constants';

describe('modelToValarm', () => {
    describe('part day', () => {
        it('should set correct trigger', () => {
            expect(
                modelToValarmComponent({
                    id: '-1',
                    isAllDay: false,
                    value: 15,
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    unit: NOTIFICATION_UNITS.MINUTE,
                    when: NOTIFICATION_WHEN.BEFORE,
                })
            ).toEqual({
                component: 'valarm',
                trigger: { value: { weeks: 0, days: 0, hours: 0, minutes: 15, seconds: 0, isNegative: true } },
                action: { value: 'DISPLAY' },
            });
        });
    });

    describe('full day', () => {
        it('should set correct trigger', () => {
            expect(
                modelToValarmComponent({
                    id: '-1',
                    type: NOTIFICATION_TYPE_API.DEVICE,
                    unit: NOTIFICATION_UNITS.DAY,
                    when: NOTIFICATION_WHEN.BEFORE,
                    isAllDay: true,
                    at: new Date(2000, 0, 1, 10, 1),
                })
            ).toEqual({
                component: 'valarm',
                trigger: { value: { weeks: 0, days: 0, hours: 13, minutes: 59, seconds: 0, isNegative: true } },
                action: { value: 'DISPLAY' },
            });
        });
    });
});
