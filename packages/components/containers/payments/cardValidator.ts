import valid from 'card-validator';
import creditCardType from 'credit-card-type';
import { c } from 'ttag';

import { isEmpty } from '@proton/shared/lib/helpers/validators';

import { CardModel } from '../../payments/core';

export const isCardNumber = (value?: string) => valid.number(value).isValid;
export const isCVV = (value: string | undefined, maxLength: number) => valid.cvv(value, maxLength).isValid;
export const isPotentiallyCVV = (value: string, maxLength: number) => valid.cvv(value, maxLength).isPotentiallyValid;
export const isPostalCode = (value: string | undefined) => valid.postalCode(value).isValid;
export const isExpirationDate = (month: string, year: string) =>
    valid.expirationDate({ month, year }).isValid && month.length === 2;

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
            const number = card?.number || '';
            const firstCreditCardType = creditCardType(number)?.[0];
            const { name, size } = firstCreditCardType?.code || { name: 'CVV', size: 3 };

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

export const getErrors = (card: CardModel, ignoreName = false): Partial<CardModel> => {
    const fields = ['number', 'month', 'year', 'cvc', 'zip', 'country'];
    if (!ignoreName) {
        fields.unshift('fullname');
    }

    return fields.reduce((acc, key) => {
        const error = check(card, key as KeyOfCardModel);
        if (error) {
            acc[key] = error;
        }
        return acc;
    }, Object.create(null));
};
