/* @ngInject */
function contactPlaceholder(dispatchers, contactCache) {
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/contact/contactPlaceholder.tpl.html'),
        link(scope) {
            const { on, unsubscribe } = dispatchers(['contacts']);
            scope.welcomePlaceholder = true;
            scope.numberElementChecked = 0;

            on('contacts', (e, { type }) => {
                if (type === 'selectContacts') {
                    const paginatedContacts = contactCache.paginate(contactCache.get('filtered'));
                    const checkedContacts = paginatedContacts.filter((c) => c.selected);

                    // We hide the welcome message when the first checkbox is tick
                    if (scope.welcomePlaceholder) {
                        scope.welcomePlaceholder = false;
                    }

                    scope.numberElementChecked = checkedContacts.length;
                }
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default contactPlaceholder;
