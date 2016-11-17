angular.module('proton.core')
.directive('cardView', (tools) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/cardView.tpl.html',
        scope: { card: '=' },
        link(scope) {
            const currentYear = new Date().getFullYear();
            const months = _.range(1, 13);
            const years = _.range(currentYear, currentYear + 12);

            scope.months = months;
            scope.years = years;
            scope.countries = tools.countries;
            const country = (scope.card.country) ? _.findWhere(scope.countries, { value: scope.card.country.value }) : _.findWhere(tools.countries, { priority: 1 });
            scope.card.country = country;
            scope.card.month = scope.months[0];
            scope.card.year = scope.years[0];
        }
    };
});
