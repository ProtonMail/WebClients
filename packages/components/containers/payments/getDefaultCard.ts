import { getFirstTop } from '../../helpers/countries';
import { CardModel } from '../../payments/core';

const getDefault = (ignoreName?: boolean): CardModel => {
    const { value: country } = getFirstTop();

    const card: CardModel = {
        fullname: '',
        number: '',
        month: '',
        year: '',
        cvc: '',
        zip: '',
        country,
    };

    if (ignoreName) {
        delete card.fullname;
    }

    return card;
};

export default getDefault;
