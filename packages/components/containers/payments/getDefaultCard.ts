import { getFirstTop } from '../../helpers/countries';
import { CardModel } from './interface';

const getDefault = (): CardModel => {
    const { value: country } = getFirstTop();

    return {
        fullname: '',
        number: '',
        month: '',
        year: '',
        cvc: '',
        zip: '',
        country,
    };
};

export default getDefault;
