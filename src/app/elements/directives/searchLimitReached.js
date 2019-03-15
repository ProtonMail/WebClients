/* @ngInject */
function searchLimitReached(gettextCatalog) {
    return {
        replace: true,
        restrict: 'E',
        template: '<div class="searchLimit-container"></div>',
        link(scope, element) {
            element[0].textContent = gettextCatalog.getString(
                'Your search matched too many results. Please limit your search and try again.',
                null,
                'Inform the user that he reach the search limit'
            );
        }
    };
}
export default searchLimitReached;
