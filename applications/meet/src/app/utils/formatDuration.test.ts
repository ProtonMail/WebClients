import { HOUR, MINUTE, SECOND } from '@proton/shared/lib/constants';

import { formatDuration } from './formatDuration';

describe('formatDuration', () => {
    it.each([
        [0, '00:00'],
        [MINUTE + 5 * SECOND, '01:05'],
        [MINUTE + 5.7 * SECOND, '01:05'],
        [HOUR, '01:00:00'],
        [HOUR + 2 * MINUTE + 5 * SECOND, '01:02:05'],
        [25 * HOUR + 5 * SECOND, '25:00:05'],
    ])('formats %i ms as %s', (durationMs, expected) => {
        expect(formatDuration(durationMs)).toBe(expected);
    });
});
