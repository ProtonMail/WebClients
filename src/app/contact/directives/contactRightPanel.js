/* @ngInject */
function contactRightPanel(dispatchers, contactCache, $stateParams, Contact) {
    const HIDE_CLASS = 'contactRightPanel-placeholder-hidden';

    const getMode = (current) => (current === 'edition' ? 'view' : 'edition');

    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/contact/contactRightPanel.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe, dispatcher } = dispatchers(['contacts']);

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

            const changeMode = ({ action, current, refresh, contact: { ID } = {}, forceRefresh }) => {
                if (action === 'toggleMode') {
                    const mode = forceRefresh ? scope.mode : getMode(current);
                    scope.$applyAsync(() => {
                        if (!isSameContact(ID)) {
                            return;
                        }

                        // Force reset view directive to refresh the view After the refresh of the contact
                        if (refresh || forceRefresh) {
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

            const load = () => {
                contactCache.find($stateParams.id).then((data) => {
                    scope.$applyAsync(() => {
                        scope.contact = data;
                    });
                });
            };

            load();

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

                // Ex when we re-sign we force the refreh cf #7400
                if (type === 'refreshContactEmails' && data.ID === scope.contact.ID) {
                    changeMode({
                        action: 'toggleMode',
                        forceRefresh: true,
                        contact: scope.contact
                    });
                }
            });

            on('keys', (e, { type, data = {} }) => {
                // Ex when we re-sign we force the refreh cf #7400
                if (type === 'reactivate' && (data.contact || {}).ID === scope.contact.ID) {
                    setTimeout(() => {
                        dispatcher.contacts('updateContact', { contact: scope.contact });
                    }, 500);
                }
            });

            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default contactRightPanel;
