import { c } from 'ttag';
import valid from 'card-validator';
import { isEmpty } from '../../helpers/validators';

export const isCardNumber = (value) => valid.number(value).isValid;
export const isCVV = (value) => valid.cvv(value).isValid;
export const isPostalCode = (value) => valid.postalCode(value, 4).isValid;
export const isExpirationDate = (month, year) => valid.expirationDate({ month, year }).isValid;

const check = (card, key) => {
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
        case 'cvc':
            if (!isCVV(value)) {
                return c('Error').t`Invalid CVC code`;
            }
            break;
        case 'zip':
            if (!isPostalCode(value)) {
                return c('Error').t`Invalid postal code`;
            }
            break;
        default:
            break;
    }
};

export const getErrors = (card) => {
    return ['fullname', 'number', 'month', 'year', 'cvc', 'zip', 'country'].reduce((acc, key) => {
        const error = check(card, key);
        if (error) {
            acc[key] = error;
        }
        return acc;
    }, Object.create(null));
};