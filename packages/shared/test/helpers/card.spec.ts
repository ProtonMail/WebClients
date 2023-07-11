import { SavedCardDetails, isExpired } from '@proton/components/payments/core';

describe('card helpers', () => {
    it('should return false if card not expired', () => {
        const currentYear = new Date().getFullYear();
        const ExpYear = '' + (currentYear + 10);

        const cardDetails: SavedCardDetails = {
            Name: 'Arthur Morgan',
            ExpMonth: '01',
            ExpYear,
            ZIP: '11111',
            Country: 'US',
            Last4: '4242',
            Brand: 'Visa',
        };

        expect(isExpired(cardDetails)).toEqual(false);
    });

    it('should return true if card expired', () => {
        const currentYear = new Date().getFullYear();
        const ExpYear = '' + (currentYear - 1);

        const cardDetails: SavedCardDetails = {
            Name: 'Arthur Morgan',
            ExpMonth: '01',
            ExpYear,
            ZIP: '11111',
            Country: 'US',
            Last4: '4242',
            Brand: 'Visa',
        };

        expect(isExpired(cardDetails)).toEqual(true);
    });

    it('should return false if there is no card details', () => {
        expect(isExpired({})).toEqual(false);
    });
});
