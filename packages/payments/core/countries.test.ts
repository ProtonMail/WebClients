import { getCountryByAbbrMap, getLocalizedCountryByAbbr } from './countries';

describe('getLocalizedCountryByAbbr', () => {
    it('should return a name in English for ISO code and common aliases', () => {
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

    it('should return a name in English for ISO code and common aliases', () => {
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
