/* @ngInject */
function contactLeftPanel(dispatchers, contactCache, $stateParams) {
    const HIDE_CLASS = 'contactLeftPanel-placeholder-hidden';

    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/contact/contactLeftPanel.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers(['contacts']);
            scope.selectedContacts = [];
            el.addClass(HIDE_CLASS);

            const selectContacts = () => {
                const paginatedContacts = contactCache.paginate(contactCache.get('filtered'));
                scope.selectedContacts = paginatedContacts.filter((c) => c.selected);

                el[0].classList[scope.selectedContacts ? 'remove' : 'add'](HIDE_CLASS);
            };

            contactCache.find($stateParams.id).then((data) =>
                scope.$applyAsync(() => {
                    scope.contact = data;
                })
            );

            on('contacts', (e, { type }) => {
                type === 'selectContacts' && selectContacts();
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default contactLeftPanel;
