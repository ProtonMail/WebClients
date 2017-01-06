angular.module('proton.core')
.directive('cardView', (tools) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/cardView.tpl.html',
        scope: {
            card: '=',
            form: '='
        },
        link(scope) {
            const currentYear = new Date().getFullYear();
            const months = _.range(1, 13);
            const years = _.range(currentYear, currentYear + 12);
            const countries = [
                { label: 'United States', value: 'US' },
                { label: 'United Kingdom', value: 'GB' },
                { label: 'Switzerland', value: 'CH' },
                { label: 'France', value: 'FR' },
                { label: 'Germany', value: 'DE' },
                { label: 'Canada', value: 'CA' },
                { label: '------------------', value: '', disabled: true }
            ].concat(tools.countries);
            const country = (scope.card.country) ? _.findWhere(countries, { value: scope.card.country.value }) : countries[0];
            scope.months = months;
            scope.years = years;
            scope.countries = countries;
            scope.card.country = country;
            scope.card.month = scope.months[0];
            scope.card.year = scope.years[0];
        }
    };
});
