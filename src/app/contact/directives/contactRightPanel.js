/* @ngInject */
function contactRightPanel(dispatchers, contactCache, $stateParams) {
    const HIDE_CLASS = 'contactRightPanel-placeholder-hidden';

    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/contact/contactRightPanel.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers(['contacts']);

            el.addClass(HIDE_CLASS);

            const selectContacts = () => {
                const paginatedContacts = contactCache.paginate(contactCache.get('filtered'));
                const selectedContacts = paginatedContacts.filter((c) => c.selected);

                el[0].classList[selectedContacts.length ? 'remove' : 'add'](HIDE_CLASS);
            };

            contactCache.find($stateParams.id).then((data) =>
                scope.$applyAsync(() => {
                    scope.contact = data;
                })
            );

            on('contacts', (e, { type }) => {
                type === 'selectContacts' && selectContacts();
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default contactRightPanel;
