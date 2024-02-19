import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors';
import { omit } from '@proton/shared/lib/helpers/object';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import { getUpdateSingleEditMergeVevent } from './getSaveEventActionsHelpers';

describe('getUpdateSingleEditMergeVevent()', () => {
    const baseVevent: VcalVeventComponent = {
        component: 'vevent',
        uid: { value: 'vLuqif_R99XqZlDXKmotcoBkJZ4j@proton.me' },
        sequence: { value: 0 },
        components: [],
        summary: { value: 'test 10' },
        location: { value: 'THE coffee shop' },
        organizer: { value: 'mailto:unlimited@proton.test', parameters: { cn: 'unlimited' } },
        dtstart: {
            value: { year: 2023, month: 5, day: 31, hours: 9, minutes: 0, seconds: 0, isUTC: false },
            parameters: { tzid: 'Europe/Oslo' },
        },
        dtend: {
            value: { year: 2023, month: 5, day: 31, hours: 9, minutes: 30, seconds: 0, isUTC: false },
            parameters: { tzid: 'Europe/Oslo' },
        },
        dtstamp: { value: { year: 2023, month: 5, day: 25, hours: 11, minutes: 46, seconds: 41, isUTC: true } },
    };

    it('should capture a modified title', () => {
        const newVevent = {
            ...baseVevent,
            summary: { value: 'new title' },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            summary: { value: 'new title' },
        });
    });

    it('should capture a modified location', () => {
        const newVevent = {
            ...baseVevent,
            location: { value: 'new location' },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            location: { value: 'new location' },
        });
    });

    it('should capture a modified description', () => {
        const newVevent = {
            ...baseVevent,
            description: { value: 'new description' },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            description: { value: 'new description' },
        });
    });

    it('should capture multiple modified fields', () => {
        const newVevent = {
            ...baseVevent,
            summary: { value: 'new title' },
            description: { value: 'new description' },
            color: { value: ACCENT_COLORS_MAP.plum.color },
        };
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            summary: { value: 'new title' },
            description: { value: 'new description' },
        });
    });

    it('should capture removed fields', () => {
        const newVevent = omit(baseVevent, ['summary', 'location']);
        expect(getUpdateSingleEditMergeVevent(newVevent, baseVevent)).toEqual({
            summary: { value: '' },
            location: { value: '' },
        });
    });
});
