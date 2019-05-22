const clean = (value) => String(value).replace(/\s+/g, '');

const formatYear = (year) => {
    const pre = String(year).length === 2 ? '20' : '';
    return `${pre}${year}`;
};

const toDetails = ({ number, month: ExpMonth, year, cvc: CVC, fullname, zip: ZIP, country: Country }) => {
    return {
        Name: clean(fullname),
        Number: clean(number),
        ExpMonth,
        ExpYear: formatYear(year),
        CVC, // Don't clean ZIP, space is allowed
        ZIP,
        Country
    };
};

export default toDetails;
