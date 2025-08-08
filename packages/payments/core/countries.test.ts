import { getCountryByAbbrMap, getLocalizedCountryByAbbr } from './countries';

describe('getLocalizedCountryByAbbr', () => {
    it('should return a relevant name for ISO code in the given language', () => {
        expect(getLocalizedCountryByAbbr('GB', {
            language: 'en-US',
            countryByAbbr: getCountryByAbbrMap(),
        })).toBe('United Kingdom');
        expect(getLocalizedCountryByAbbr('GB', {
            language: 'fr-CH',
            countryByAbbr: getCountryByAbbrMap(),
        })).toBe('Royaume-Uni');
        expect(getLocalizedCountryByAbbr('IT', {
            language: 'en-US',
            countryByAbbr: getCountryByAbbrMap(),
        })).toBe('Italy');
        expect(getLocalizedCountryByAbbr('IT', {
            language: 'fr-CH',
            countryByAbbr: getCountryByAbbrMap(),
        })).toBe('Italie');
    });

    it('should return a relevant name for common country code aliases in the given language', () => {
        expect(getLocalizedCountryByAbbr('UK', {
            language: 'en-US',
            countryByAbbr: getCountryByAbbrMap(),
        })).toBe('United Kingdom');
        expect(getLocalizedCountryByAbbr('UK', {
            language: 'fr-CH',
            countryByAbbr: getCountryByAbbrMap(),
        })).toBe('Royaume-Uni');
    });
});
