import { useState } from 'react';

import { getErrors } from './cardValidator';
import getDefaultCard from './getDefaultCard';

export interface Card {
    fullname: string;
    number: string;
    month: string;
    year: string;
    cvc: string;
    zip: string;
    country: string;
}

const useCard = (initialCard = getDefaultCard()) => {
    const [card, update] = useState<Card>(initialCard);
    const setCard = (key: string, value: string) => update((card) => ({ ...card, [key]: value }));
    const errors = getErrors(card);
    const isValid = !Object.keys(errors).length;

    return { card, setCard, errors, isValid };
};

export default useCard;
