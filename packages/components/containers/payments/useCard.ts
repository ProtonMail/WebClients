import { useState } from 'react';

import { CardModel } from '../../payments/core/interface';
import { getErrors } from './cardValidator';
import getDefaultCard from './getDefaultCard';

const useCard = (initialCard: CardModel = getDefaultCard()) => {
    const [card, update] = useState<CardModel>(initialCard);
    const setCard = (key: keyof CardModel, value: string) => update((card) => ({ ...card, [key]: value }));
    const errors = getErrors(card);
    const isValid = !Object.keys(errors).length;

    return { card, setCard, errors, isValid };
};

export default useCard;
