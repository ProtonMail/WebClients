angular.module('proton.formUtils')
    .factory('cardModel', () => {
        const clean = (value) => String(value).replace(/\s+/g, '');
        /**
         * Add a 0 before the month number to match the API format
         * 1 => 01
         * 10 => 10
         * @param  {Number} number
         * @return {String}
         */
        const formatMonth = (number = 1) => `0${number}`.slice(-2);
        const formatYear = (year) => {
            const pre = (String(year).length === 2) ? '20' : '';
            return `${pre}${year}`;
        };

        return (data = {}) => {
            const card = angular.copy(data);
            const number = () => clean(card.number);
            const month = () => formatMonth(card.month);
            const year = () => formatYear(card.year);
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
