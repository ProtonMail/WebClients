angular.module('proton.elements')
    .directive('searchLimitReached', (gettextCatalog) => {
        const message = gettextCatalog.getString('Your search matched too many results. Please limit your search and try again.', null, 'Inform the user that he reach the search limit');

        return {
            replace: true,
            restrict: 'E',
            template: '<div class="searchLimit-container"></div>',
            link(scope, element) {
                element[0].textContent = message;
            }
        };
    });
