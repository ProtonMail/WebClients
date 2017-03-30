angular.module('proton.formUtils')
    .factory('cardModel', () => {
        const clean = (value) => value.replace(/\s/g, '');

        return (data = {}) => {
            const card = angular.copy(data);
            const number = () => clean(card.number);
            const month = () => card.month;
            const year = () => ((year.length === 2) ? '20' + card.year : card.year);
            const cvc = () => clean(card.cvc);
            const fullname = () => card.fullname;
            const zip = () => clean(card.zip);
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
    });
