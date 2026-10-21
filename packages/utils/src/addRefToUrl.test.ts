import { addRefToUrl } from './addRefToUrl';

describe('addRefToUrl', () => {
    it('appends ref with ? to a URL without params', () => {
        expect(addRefToUrl('/upgrade', 'upsell_mail-banner-storage')).toBe('/upgrade?ref=upsell_mail-banner-storage');
    });

    it('appends ref with & to a URL with existing params', () => {
        expect(addRefToUrl('/dashboard?plan=mail2022', 'upsell_mail-banner-storage')).toBe(
            '/dashboard?plan=mail2022&ref=upsell_mail-banner-storage'
        );
    });

    it('returns the URL unchanged when ref is undefined', () => {
        expect(addRefToUrl('/upgrade')).toBe('/upgrade');
    });

    it('returns the URL unchanged when ref is empty', () => {
        expect(addRefToUrl('/upgrade', '')).toBe('/upgrade');
    });
});
