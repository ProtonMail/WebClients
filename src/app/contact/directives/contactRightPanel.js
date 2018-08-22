/* @ngInject */
function contactRightPanel(dispatchers, contactCache, $stateParams, Contact) {
    const HIDE_CLASS = 'contactRightPanel-placeholder-hidden';

    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/contact/contactRightPanel.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            scope.mode = 'view';

            const selectContacts = () => {
                const list = contactCache.paginate(contactCache.get('filtered'));
                const hasSelected = list.some((c) => c.selected);

                el[0].classList[hasSelected ? 'remove' : 'add'](HIDE_CLASS);
            };

            const isSameContact = (ID) => {
                if (!scope.contact) {
                    return false;
                }
                return scope.contact.ID === ID;
            };

            const changeMode = ({ action, current, refresh, contact: { ID } = {} }) => {
                if (action === 'toggleMode') {
                    const mode = current === 'edition' ? 'view' : 'edition';
                    scope.$applyAsync(() => {
                        if (!isSameContact(ID)) {
                            return;
                        }

                        // Force reset view directive to refresh the view After the refresh of the contact
                        if (refresh) {
                            scope.mode = '';

                            // Cannot use $applyAsync inside another one, need to defer it
                            return _rAF(() => {
                                scope.$applyAsync(() => {
                                    scope.mode = mode;
                                });
                            });
                        }

                        scope.mode = mode;
                    });
                }
            };

            contactCache.find($stateParams.id).then((data) => {
                scope.$applyAsync(() => {
                    scope.contact = data;
                });
            });

            on('contacts', (e, { type, data = {} }) => {
                type === 'selectContacts' && selectContacts();
                type === 'action.input' && changeMode(data);

                const { contact = {} } = data;
                if (type === 'contactUpdated' && contact.ID === scope.contact.ID) {
                    Contact.decrypt({
                        ...contact,
                        Cards: data.cards
                    }).then((data) => {
                        scope.$applyAsync(() => {
                            scope.contact = data;
                        });
                    });
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default contactRightPanel;
