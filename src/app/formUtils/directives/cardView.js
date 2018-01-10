import _ from 'lodash';

/* @ngInject */
function cardView(countriesListModel) {
    const countries = countriesListModel();
    const currentYear = new Date().getFullYear();
    const months = _.range(1, 13).map((i) => `0${i}`.slice(-2));
    const years = _.range(currentYear, currentYear + 12);

    return {
        replace: true,
        templateUrl: require('../../../templates/formUtils/cardView.tpl.html'),
        scope: {
            card: '=',
            form: '='
        },
        link(scope) {
            const country = scope.card.country ? _.find(countries, { value: scope.card.country.value }) : countries[0];
            scope.months = months;
            scope.years = years;
            scope.countries = countries;
            scope.card.country = country;
            scope.card.month = scope.months[0];
            scope.card.year = scope.years[0];
        }
    };
}
export default cardView;
