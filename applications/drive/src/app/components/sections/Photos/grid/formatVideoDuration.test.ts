import { formatVideoDuration } from './formatVideoDuration';

jest.mock('@proton/shared/lib/i18n', () => ({
    dateLocale: {
        code: 'en-US',
        formatLong: {
            time: jest.fn(),
        },
    },
}));
describe('formatVideoDuration()', () => {
    it('format a duration without hours', () => {
        const durationInSeconds = 65; // 1 minute and 5 seconds
        const formattedDuration = formatVideoDuration(durationInSeconds);
        expect(formattedDuration).toBe('1:05');
    });

    it('format a duration with hours', () => {
        const durationInSeconds = 3665; // 1 hour, 1 minute, and 5 seconds
        const formattedDuration = formatVideoDuration(durationInSeconds);
        expect(formattedDuration).toBe('1:01:05');
    });

    it('format a duration in different locale', () => {
        const durationInSeconds = 3665; // 1 hour, 1 minute, and 5 seconds
        const formattedDuration = formatVideoDuration(durationInSeconds, 'fr-FR');
        expect(formattedDuration).toBe('1:01:05');
    });
});
