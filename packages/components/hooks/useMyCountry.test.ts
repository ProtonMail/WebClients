import { getCountryFromLanguage } from './useMyCountry';

describe('getCountryFromLanguage()', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should prioritize languages as given by the browser', () => {
        const mockNavigator = jest.spyOn(window, 'navigator', 'get');
        mockNavigator.mockReturnValue({
            ...window.navigator,
            languages: ['de-DE', 'en-EN'],
        });

        expect(getCountryFromLanguage()).toEqual('de');
    });

    it('should prioritize languages with country code', () => {
        const mockNavigator = jest.spyOn(window, 'navigator', 'get');
        mockNavigator.mockReturnValue({
            ...window.navigator,
            languages: ['fr', 'en_CA'],
        });

        expect(getCountryFromLanguage()).toEqual('ca');
    });

    it('should return undefined when the browser language tags do not have country code', () => {
        const mockNavigator = jest.spyOn(window, 'navigator', 'get');
        mockNavigator.mockReturnValue({
            ...window.navigator,
            languages: ['fr', 'en'],
        });

        expect(getCountryFromLanguage()).toBeUndefined();
    });
});
