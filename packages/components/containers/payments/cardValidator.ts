import { c } from 'ttag';
import valid from 'card-validator';
import creditCardType from 'credit-card-type';
import { isEmpty } from 'proton-shared/lib/helpers/validators';

export const isCardNumber = (value: string) => valid.number(value).isValid;
export const isCVV = (value: string, maxLength: number) => valid.cvv(value, maxLength).isValid;
export const isPostalCode = (value: string) => valid.postalCode(value).isValid;
export const isExpirationDate = (month: string, year: string) => valid.expirationDate({ month, year }).isValid;

interface Card {
    fullname: string;
    month: string;
    year: string;
    number: string;
    cvc: string;
    zip: string;
}

type KeyCard = 'fullname' | 'month' | 'year' | 'number' | 'cvc' | 'zip';

const check = (card: Card, key: KeyCard): string | undefined => {
    const value = card[key];
    switch (key) {
        case 'fullname':
            if (isEmpty(value)) {
                return c('Error').t`Name on card required`;
            }
            break;
        case 'month':
        case 'year':
            if (!isExpirationDate(card.month, card.year)) {
                return c('Error').t`Invalid expiration date`;
            }
            break;
        case 'number':
            if (!isCardNumber(value)) {
                return c('Error').t`Invalid card number`;
            }
            break;
        case 'cvc': {
            const { number = '' } = card || {};
            const [{ code = {} } = {}] = creditCardType(number) || [];
            const { name = 'CVC', size = 3 } = code;

            if (!isCVV(value, size)) {
                return c('Error').t`Invalid ${name} code`;
            }

            break;
        }
        case 'zip':
            if (!isPostalCode(value)) {
                return c('Error').t`Invalid postal code`;
            }
            break;
        default:
            break;
    }
};

export const getErrors = (
    card: Card
): {
    fullname?: string;
    month?: string;
    year?: string;
    number?: string;
    cvc?: string;
    zip?: string;
} => {
    return ['fullname', 'number', 'month', 'year', 'cvc', 'zip', 'country'].reduce((acc, key) => {
        const error = check(card, key as KeyCard);
        if (error) {
            acc[key] = error;
        }
        return acc;
    }, Object.create(null));
};
