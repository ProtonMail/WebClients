import { isExpired } from '@proton/shared/lib/helpers/card';
import { CardDetails } from '@proton/shared/lib/interfaces';

describe('card helpers', () => {
    it('should return false if card not expired', () => {
        let currentYear = new Date().getFullYear();
        let ExpYear = '' + (currentYear + 10);

        let cardDetails: CardDetails = {
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
        let currentYear = new Date().getFullYear();
        let ExpYear = '' + (currentYear - 1);

        let cardDetails: CardDetails = {
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
