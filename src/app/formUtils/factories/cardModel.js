/* @ngInject */
function cardModel() {
    const clean = (value) => String(value).replace(/\s+/g, '');
    const formatYear = (year) => {
        const pre = String(year).length === 2 ? '20' : '';
        return `${pre}${year}`;
    };

    return (data = {}) => {
        const card = angular.copy(data);
        const number = () => clean(card.number);
        const month = () => card.month;
        const year = () => formatYear(card.year);
        const cvc = () => clean(card.cvc);
        const fullname = () => card.fullname;
        const zip = () => card.zip; // NOTE don't clean the ZIP, space is allowed
        const country = () => card.country.value;
        const details = () => ({
            Number: number(),
            ExpMonth: month(),
            ExpYear: year(),
            CVC: cvc(),
            Name: fullname(),
            Country: country(),
            ZIP: zip()
        });

        return { number, month, year, cvc, fullname, zip, country, details };
    };
}
export default cardModel;
