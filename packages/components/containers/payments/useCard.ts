import { useState } from 'react';

import { CardModel } from '../../payments/core';
import { getErrors } from './cardValidator';
import getDefaultCard from './getDefaultCard';

export type CardFieldStatus = {
    fullname: boolean;
    number: boolean;
    month: boolean;
    year: boolean;
    cvc: boolean;
    zip: boolean;
    country: boolean;
};

const getInitialFieldStatus = (): CardFieldStatus => ({
    fullname: true,
    number: true,
    month: true,
    year: true,
    cvc: true,
    zip: true,
    country: true,
});

const useCard = ({
    initialCard,
    ignoreName = false,
}: {
    initialCard?: CardModel;
    ignoreName?: boolean;
} = {}) => {
    const definedInitialCard = initialCard ?? getDefaultCard(ignoreName);

    const [card, update] = useState<CardModel>(definedInitialCard);
    const setCard = (key: keyof CardModel, value: string) => update((card) => ({ ...card, [key]: value }));
    const errors = getErrors(card, ignoreName);
    const isValid = !Object.keys(errors).length;

    const fields = Object.keys(errors) as (keyof CardModel)[];
    const fieldsStatus: CardFieldStatus = getInitialFieldStatus();
    for (const field of fields) {
        fieldsStatus[field] = !errors[field];
    }

    return { card, setCard, errors, isValid, fieldsStatus };
};

export default useCard;
