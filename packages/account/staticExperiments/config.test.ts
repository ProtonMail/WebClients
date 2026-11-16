import { staticExperimentsConfig } from './config';

const mockTimeZone = (timeZone: string) => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({
        timeZone,
    } as Intl.ResolvedDateTimeFormatOptions);
};

describe('PaypalFirst enabled', () => {
    const { enabled } = staticExperimentsConfig.PaypalFirst;

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.each(['Europe/Berlin', 'Europe/Busingen'])('is enabled in %s', (timeZone) => {
        mockTimeZone(timeZone);

        expect(enabled()).toBe(true);
    });

    it.each(['Europe/Vienna', 'Europe/Zurich', 'America/New_York', 'UTC'])('is disabled in %s', (timeZone) => {
        mockTimeZone(timeZone);

        expect(enabled()).toBe(false);
    });

    it('is disabled when the time zone cannot be read', () => {
        vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(() => {
            throw new Error('Intl not supported');
        });

        expect(enabled()).toBe(false);
    });
});
