import {
    NOTIFICATION_UNITS,
    NOTIFICATION_WHEN,
    SETTINGS_NOTIFICATION_TYPE,
} from '@proton/shared/lib/calendar/constants';
import { EventModel } from '@proton/shared/lib/interfaces/calendar';

import { modelToValarmComponents } from './modelToProperties';

describe('model to valarm', () => {
    describe('part day', () => {
        it('should transform to valarm components', () => {
            const model = {
                isAllDay: false,
                partDayNotifications: [
                    {
                        value: 1,
                        type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                        unit: NOTIFICATION_UNITS.HOUR,
                        when: NOTIFICATION_WHEN.AFTER,
                    },
                    {
                        value: 15,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.MINUTE,
                        when: NOTIFICATION_WHEN.BEFORE,
                    },
                    {
                        value: 10,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.MINUTE,
                        when: NOTIFICATION_WHEN.BEFORE,
                    },
                ],
            } as EventModel;
            expect(modelToValarmComponents(model)).toEqual(
                expect.arrayContaining([
                    {
                        component: 'valarm',
                        action: {
                            value: 'EMAIL',
                        },
                        trigger: {
                            value: {
                                days: 0,
                                hours: 1,
                                isNegative: false,
                                minutes: 0,
                                seconds: 0,
                                weeks: 0,
                            },
                        },
                    },
                    {
                        component: 'valarm',
                        action: {
                            value: 'DISPLAY',
                        },
                        trigger: {
                            value: {
                                days: 0,
                                hours: 0,
                                isNegative: true,
                                minutes: 15,
                                seconds: 0,
                                weeks: 0,
                            },
                        },
                    },
                    {
                        component: 'valarm',
                        action: {
                            value: 'DISPLAY',
                        },
                        trigger: {
                            value: {
                                days: 0,
                                hours: 0,
                                isNegative: true,
                                minutes: 10,
                                seconds: 0,
                                weeks: 0,
                            },
                        },
                    },
                ])
            );
        });

        it('should remove duplicate notifications (part day)', () => {
            const model = {
                isAllDay: false,
                partDayNotifications: [
                    {
                        value: 1,
                        type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                        unit: NOTIFICATION_UNITS.HOUR,
                        when: NOTIFICATION_WHEN.AFTER,
                    },
                    {
                        value: 1,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.HOUR,
                        when: NOTIFICATION_WHEN.BEFORE,
                    },
                    {
                        value: 60,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.MINUTE,
                        when: NOTIFICATION_WHEN.BEFORE,
                    },
                    {
                        value: 15,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.MINUTE,
                        when: NOTIFICATION_WHEN.BEFORE,
                    },
                    {
                        value: 15,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.MINUTE,
                        when: NOTIFICATION_WHEN.BEFORE,
                    },
                ],
            } as EventModel;
            expect(modelToValarmComponents(model)).toEqual([
                {
                    component: 'valarm',
                    action: {
                        value: 'EMAIL',
                    },
                    trigger: {
                        value: {
                            days: 0,
                            hours: 1,
                            isNegative: false,
                            minutes: 0,
                            seconds: 0,
                            weeks: 0,
                        },
                    },
                },
                {
                    component: 'valarm',
                    action: {
                        value: 'DISPLAY',
                    },
                    trigger: {
                        value: {
                            days: 0,
                            hours: 1,
                            isNegative: true,
                            minutes: 0,
                            seconds: 0,
                            weeks: 0,
                        },
                    },
                },
                {
                    component: 'valarm',
                    action: {
                        value: 'DISPLAY',
                    },
                    trigger: {
                        value: {
                            days: 0,
                            hours: 0,
                            isNegative: true,
                            minutes: 15,
                            seconds: 0,
                            weeks: 0,
                        },
                    },
                },
            ]);
        });
    });

    describe('all day', () => {
        it('should transform to valarm components', () => {
            const model = {
                isAllDay: true,
                fullDayNotifications: [
                    {
                        value: 1,
                        type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                        unit: NOTIFICATION_UNITS.DAY,
                        when: NOTIFICATION_WHEN.AFTER,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                    {
                        value: 1,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.DAY,
                        when: NOTIFICATION_WHEN.BEFORE,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                    {
                        value: 2,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.DAY,
                        when: NOTIFICATION_WHEN.BEFORE,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                ],
            } as EventModel;
            expect(modelToValarmComponents(model)).toEqual([
                {
                    component: 'valarm',
                    action: {
                        value: 'EMAIL',
                    },
                    trigger: {
                        value: {
                            days: 1,
                            hours: 10,
                            isNegative: false,
                            minutes: 1,
                            seconds: 0,
                            weeks: 0,
                        },
                    },
                },
                {
                    component: 'valarm',
                    action: {
                        value: 'DISPLAY',
                    },
                    trigger: {
                        value: {
                            days: 0,
                            hours: 13,
                            isNegative: true,
                            minutes: 59,
                            seconds: 0,
                            weeks: 0,
                        },
                    },
                },
                {
                    component: 'valarm',
                    action: {
                        value: 'DISPLAY',
                    },
                    trigger: {
                        value: {
                            days: 1,
                            hours: 13,
                            isNegative: true,
                            minutes: 59,
                            seconds: 0,
                            weeks: 0,
                        },
                    },
                },
            ]);
        });

        it('should remove duplicate notifications', () => {
            const model = {
                isAllDay: true,
                fullDayNotifications: [
                    {
                        value: 1,
                        type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                        unit: NOTIFICATION_UNITS.DAY,
                        when: NOTIFICATION_WHEN.AFTER,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                    {
                        value: 1,
                        type: SETTINGS_NOTIFICATION_TYPE.EMAIL,
                        unit: NOTIFICATION_UNITS.DAY,
                        when: NOTIFICATION_WHEN.AFTER,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                    {
                        value: 1,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.DAY,
                        when: NOTIFICATION_WHEN.AFTER,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                    {
                        value: 1,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.DAY,
                        when: NOTIFICATION_WHEN.AFTER,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                    {
                        value: 1,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.DAY,
                        when: NOTIFICATION_WHEN.BEFORE,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                    {
                        value: 2,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.DAY,
                        when: NOTIFICATION_WHEN.BEFORE,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                    {
                        value: 0,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.DAY,
                        when: NOTIFICATION_WHEN.BEFORE,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                    {
                        value: 0,
                        type: SETTINGS_NOTIFICATION_TYPE.DEVICE,
                        unit: NOTIFICATION_UNITS.WEEK,
                        when: NOTIFICATION_WHEN.BEFORE,
                        isAllDay: true,
                        at: new Date(2000, 0, 1, 10, 1),
                    },
                ],
            } as EventModel;
            expect(modelToValarmComponents(model)).toEqual(
                expect.arrayContaining([
                    {
                        component: 'valarm',
                        action: {
                            value: 'EMAIL',
                        },
                        trigger: {
                            value: {
                                days: 1,
                                hours: 10,
                                isNegative: false,
                                minutes: 1,
                                seconds: 0,
                                weeks: 0,
                            },
                        },
                    },
                    {
                        component: 'valarm',
                        action: {
                            value: 'DISPLAY',
                        },
                        trigger: {
                            value: {
                                days: 1,
                                hours: 10,
                                isNegative: false,
                                minutes: 1,
                                seconds: 0,
                                weeks: 0,
                            },
                        },
                    },
                    {
                        component: 'valarm',
                        action: {
                            value: 'DISPLAY',
                        },
                        trigger: {
                            value: {
                                days: 0,
                                hours: 13,
                                isNegative: true,
                                minutes: 59,
                                seconds: 0,
                                weeks: 0,
                            },
                        },
                    },
                    {
                        component: 'valarm',
                        action: {
                            value: 'DISPLAY',
                        },
                        trigger: {
                            value: {
                                days: 1,
                                hours: 13,
                                isNegative: true,
                                minutes: 59,
                                seconds: 0,
                                weeks: 0,
                            },
                        },
                    },
                ])
            );
        });
    });
});
