import { isSwissTimezone } from './timezone';

describe('isSwissTimezone', () => {
    it('recognizes the Swiss timezone', () => {
        expect(isSwissTimezone('Europe/Zurich')).toBe(true);
    });

    it('rejects other timezones', () => {
        expect(isSwissTimezone('Europe/Paris')).toBe(false);
        expect(isSwissTimezone('UTC')).toBe(false);
    });
});
