const formatYear = (year) => {
    const pre = String(year).length === 2 ? '20' : '';
    return `${pre}${year}`;
};

const toDetails = ({ number, month: ExpMonth, year, cvc: CVC, fullname, zip: ZIP, country: Country }) => {
    return {
        Name: String(fullname).trim(),
        Number: String(number).replace(/\s+/g, ''),
        ExpMonth,
        ExpYear: formatYear(year),
        CVC, // Don't clean ZIP, space is allowed
        ZIP,
        Country
    };
};

export default toDetails;
