import { CardModel } from '../../payments/core';

const formatYear = (year: any) => {
    const pre = String(year).length === 2 ? '20' : '';
    return `${pre}${year}`;
};

const clear = (v: any) => String(v).trim();

const toDetails = ({ number, month: ExpMonth, year, cvc: CVC, fullname, zip: ZIP, country: Country }: CardModel) => {
    const resultWithoutName = {
        Number: String(number).replace(/\s+/g, ''),
        ExpMonth,
        ExpYear: formatYear(year),
        CVC, // Don't clean ZIP, space is allowed
        ZIP,
        Country,
    };

    if (fullname === undefined || fullname === null) {
        return resultWithoutName;
    }

    return {
        ...resultWithoutName,
        Name: clear(fullname),
    };
};

export default toDetails;
