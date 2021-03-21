import { useState } from 'react';

import { getErrors } from './cardValidator';
import getDefaultCard from './getDefaultCard';

import { CardModel } from './interface';

const useCard = (initialCard = getDefaultCard()) => {
    const [card, update] = useState<CardModel>(initialCard);
    const setCard = (key: string, value: string) => update((card) => ({ ...card, [key]: value }));
    const errors = getErrors(card);
    const isValid = !Object.keys(errors).length;

    return { card, setCard, errors, isValid };
};

export default useCard;
