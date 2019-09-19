import { getFirstTop } from '../../helpers/countries';

const getDefault = () => {
    const { value: country } = getFirstTop();

    return {
        fullname: '',
        number: '',
        month: '',
        year: '',
        cvc: '',
        zip: '',
        country
    };
};

export default getDefault;
