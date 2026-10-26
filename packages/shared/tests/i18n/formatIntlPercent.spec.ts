import { formatIntlPercent } from '../../lib/i18n/formatIntlPercent';

describe('formatIntlPercent()', () => {
    it('places the sign and percent symbol according to the locale', () => {
        expect(formatIntlPercent(-40, {}, 'en_US')).toEqual('-40%');
        expect(formatIntlPercent(-40, {}, 'tr_TR')).toEqual('-%40');
        expect(formatIntlPercent(-40, {}, 'de_DE')).toEqual('-40 %');
        expect(formatIntlPercent(-40, {}, 'sv_SE')).toEqual('−40 %');
    });

    it('formats positive percentages', () => {
        expect(formatIntlPercent(40, {}, 'en_US')).toEqual('40%');
        expect(formatIntlPercent(40, {}, 'tr_TR')).toEqual('%40');
    });

    it('falls back to en-US when the locale is not recognized', () => {
        expect(formatIntlPercent(-40, {}, 'xx_XX')).toEqual('-40%');
    });
});
