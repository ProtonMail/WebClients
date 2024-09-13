import valid from 'card-validator';
import creditCardType from 'credit-card-type';
import { c } from 'ttag';

import { isSavedCardDetails } from './helpers';
import { type CreateCardDetailsBackend } from './interface';

const formatYear = (year: any) => {
    const pre = String(year).length === 2 ? '20' : '';
    return `${pre}${year}`;
};

export interface CardModel {
    number: string;
    month: string;
    year: string;
    cvc: string;
    zip: string;
    country: string;
}

export const toDetails = ({
    number,
    month: ExpMonth,
    year,
    cvc: CVC,
    zip: ZIP,
    country: Country,
}: CardModel): CreateCardDetailsBackend => {
    return {
        Number: String(number).replace(/\s+/g, ''),
        ExpMonth,
        ExpYear: formatYear(year),
        CVC, // Don't clean ZIP, space is allowed
        ZIP,
        Country,
    };
};
export const getDefaultCard = (): CardModel => {
    const initialCountry = 'US';

    return {
        number: '',
        month: '',
        year: '',
        cvc: '',
        zip: '',
        country: initialCountry,
    };
};
export const isCardNumber = (value: string | undefined) => valid.number(value).isValid;
export const isCVV = (value: string | undefined, maxLength: number) => valid.cvv(value, maxLength).isValid;
export const isPostalCode = (value: string | undefined) => valid.postalCode(value).isValid;
export const isExpirationDate = (month: string, year: string) => valid.expirationDate({ month, year }).isValid;

const check = (card: CardModel, key: keyof CardModel): string | undefined => {
    const value = card[key];
    switch (key) {
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
export const getErrors = (card: CardModel): Partial<CardModel> => {
    return ['number', 'month', 'year', 'cvc', 'zip', 'country'].reduce((acc, key) => {
        const error = check(card, key as keyof CardModel);
        if (error) {
            acc[key] = error;
        }
        return acc;
    }, Object.create(null));
};
export const isValid = (card: CardModel) => !Object.keys(getErrors(card)).length;

/**
 * Check if card is expired at the end of current month
 */
export function isExpired(cardDetails: CreateCardDetailsBackend | unknown): boolean {
    if (!isSavedCardDetails(cardDetails)) {
        return false;
    }

    const { ExpMonth, ExpYear } = cardDetails;

    const currentTime = new Date();
    const currentMonth = currentTime.getMonth() + 1;
    const currentYear = currentTime.getFullYear();

    return currentYear > +ExpYear || (currentMonth > +ExpMonth && currentYear === +ExpYear);
}
