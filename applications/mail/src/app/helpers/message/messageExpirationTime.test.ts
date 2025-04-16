import frCHLocale from 'date-fns/locale/fr-CH';

import { enUSLocale } from '@proton/shared/lib/i18n/dateFnLocales';

import { getAutoDeleteOnMessage, getExpiresOnMessage } from './messageExpirationTime';

let mockDateLocale = enUSLocale;
const testDate = new Date('2025-01-01T20:00:00');

jest.mock('@proton/shared/lib/i18n', () => ({
    ...jest.requireActual('@proton/shared/lib/i18n'),
    get dateLocale() {
        return mockDateLocale;
    },
}));

describe('MessageExpirationTime', () => {
    beforeEach(() => {
        mockDateLocale = enUSLocale;
    });

    describe('getAutoDeleteOnMessage', () => {
        it('should return the correct auto-delete time with default locale', () => {
            mockDateLocale = frCHLocale;
            const result = getAutoDeleteOnMessage(testDate);
            expect(result).toContain('20:00');
        });

        it('should handle US date format correctly', () => {
            mockDateLocale = enUSLocale;
            const result = getAutoDeleteOnMessage(testDate);
            expect(result).toContain('8:00 PM');
        });
    });

    describe('getExpiresOnMessage', () => {
        it('should return the correct expiration time with default locale', () => {
            mockDateLocale = frCHLocale;
            const result = getExpiresOnMessage(testDate);
            expect(result).toContain('20:00');
        });

        it('should handle US date format correctly', () => {
            mockDateLocale = enUSLocale;
            const result = getExpiresOnMessage(testDate);
            expect(result).toContain('8:00 PM');
        });
    });
});
