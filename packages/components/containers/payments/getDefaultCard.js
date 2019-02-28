import { getFirstTop } from '../../helpers/countries';

const getDefault = () => {
    const now = new Date();
    const nextYear = `${now.getFullYear() + 1}`;
    const currentMonth = `0${now.getMonth() + 1}`.slice(-2);
    const { value: country } = getFirstTop();

    return {
        fullname: '',
        number: '',
        month: currentMonth,
        year: nextYear,
        cvc: '',
        zip: '',
        country
    };
};

export default getDefault;