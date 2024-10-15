import { type CardModel, isPostalCode, toDetails } from './cardDetails';

describe('postal code', () => {
    it('should validate invalid postal code', () => {
        expect(isPostalCode('')).toBe(false);
        expect(isPostalCode('1')).toBe(false);
        expect(isPostalCode('12')).toBe(false);
    });

    it('should validate us postal code', () => {
        expect(isPostalCode('CA95014')).toBe(true);
    });

    it('should validate polish postal code', () => {
        expect(isPostalCode('31-444')).toBe(true);
    });
});

describe('cardDetails', () => {
    it('should format card details correctly', () => {
        let card: CardModel = {
            number: '4111 1111 1111 1111',
            month: '10',
            year: '2020',
            cvc: '123',
            zip: '123 45',
            country: 'US',
        };

        expect(toDetails(card)).toEqual({
            Number: '4111111111111111',
            ExpMonth: '10',
            ExpYear: '2020',
            CVC: '123',
            ZIP: '123 45',
            Country: 'US',
        });

        card = {
            number: '4111 1111 1111 1111',
            month: '10',
            year: '32',
            cvc: '123',
            zip: '123 45',
            country: 'US',
        };

        expect(toDetails(card)).toEqual({
            Number: '4111111111111111',
            ExpMonth: '10',
            ExpYear: '2032',
            CVC: '123',
            ZIP: '123 45',
            Country: 'US',
        });
    });
});
