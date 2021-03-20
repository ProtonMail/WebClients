import { c } from 'ttag';
import valid from 'card-validator';
import creditCardType from 'credit-card-type';
import { isEmpty } from 'proton-shared/lib/helpers/validators';
import { CardModel } from './interface';

export const isCardNumber = (value: string) => valid.number(value).isValid;
export const isCVV = (value: string, maxLength: number) => valid.cvv(value, maxLength).isValid;
export const isPostalCode = (value: string) => valid.postalCode(value).isValid;
export const isExpirationDate = (month: string, year: string) => valid.expirationDate({ month, year }).isValid;

type KeyOfCardModel = keyof CardModel;

const check = (card: CardModel, key: KeyOfCardModel): string | undefined => {
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

export const getErrors = (card: CardModel): Partial<CardModel> => {
    return ['fullname', 'number', 'month', 'year', 'cvc', 'zip', 'country'].reduce((acc, key) => {
        const error = check(card, key as KeyOfCardModel);
        if (error) {
            acc[key] = error;
        }
        return acc;
    }, Object.create(null));
};
