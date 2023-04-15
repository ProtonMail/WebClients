import { stringifySearchParams } from '@proton/shared/lib/helpers/url';

describe('url', () => {
    it('should not stringify empty values', () => {
        expect(
            stringifySearchParams({
                plan: '',
                currency: undefined,
            })
        ).toBe('');
    });

    it('should not stringify empty values with value', () => {
        expect(
            stringifySearchParams({
                plan: '',
                currency: undefined,
                coupon: 'test',
            })
        ).toBe('coupon=test');
    });
});
