import { getPlanIDs, hasLifetime } from '../../lib/helpers/subscription';

describe('getPlanIDs', () => {
    it('should extract plans properly', () => {
        expect(
            getPlanIDs({
                Plans: [
                    { ID: 'a', Quantity: 1 },
                    { ID: 'a', Quantity: 1 },
                    { ID: 'b', Quantity: 3 },
                ],
            })
        ).toEqual({
            a: 2,
            b: 3,
        });
    });
});

describe('hasLifetime', () => {
    it('should have LIFETIME', () => {
        expect(hasLifetime({ CouponCode: 'LIFETIME' })).toBe(true);
    });

    it('should not have LIFETIME', () => {
        expect(hasLifetime({ CouponCode: 'PANDA' })).toBe(false);
    });
});
