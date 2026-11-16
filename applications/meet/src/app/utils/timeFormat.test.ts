import { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import { formatTimeHHMM } from './timeFormat';

describe('formatTimeHHMM', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('formats an afternoon time on a 12-hour clock', () => {
        expect(formatTimeHHMM(13, 45, SETTINGS_TIME_FORMAT.H12)).toBe('1:45 PM');
    });

    it('formats midnight as 12 AM on a 12-hour clock', () => {
        expect(formatTimeHHMM(0, 0, SETTINGS_TIME_FORMAT.H12)).toBe('12:00 AM');
    });

    it('formats an afternoon time on a 24-hour clock', () => {
        expect(formatTimeHHMM(13, 45, SETTINGS_TIME_FORMAT.H24)).toBe('13:45');
    });

    it('formats the same time when the device is in a zone far from UTC', () => {
        vi.stubEnv('TZ', 'Pacific/Kiritimati');

        expect(formatTimeHHMM(13, 45, SETTINGS_TIME_FORMAT.H12)).toBe('1:45 PM');
    });
});
