/* @ngInject */
function contactRightPanel(
    dispatchers,
    contactCache,
    $stateParams,
    Contact,
    contactEncryptionAddressMap,
    networkActivityTracker
) {
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

            const changeMode = async ({ action, current, refresh, contact: { ID } = {}, forceRefresh }) => {
                if (action === 'toggleMode') {
                    const mode = forceRefresh ? scope.mode : getMode(current);
                    return new Promise((resolve, reject) => {
                        scope.$applyAsync(() => {
                            if (!isSameContact(ID)) {
                                return reject(new Error('Not the same contact'));
                            }

                            // Force reset view directive to refresh the view After the refresh of the contact
                            if (refresh || forceRefresh) {
                                scope.mode = '';

                                // Cannot use $applyAsync inside another one, need to defer it
                                return _rAF(() => {
                                    scope.$applyAsync(() => {
                                        scope.mode = mode;
                                        resolve();
                                    });
                                });
                            }

                            scope.mode = mode;
                            resolve();
                        });
                    });
                }
            };

            const load = async () => {
                const promise = Contact.get($stateParams.id);
                const data = await networkActivityTracker.track(promise);
                contactEncryptionAddressMap.init($stateParams.id, data.vCard);
                scope.$applyAsync(() => {
                    scope.contact = data;
                });
            };

            const updateContact = async ({ contact, cards: Cards }) => {
                // If we refresh the email the card won't be available (ex adding a group)
                if (!Cards) {
                    return;
                }

                const item = await Contact.decrypt({
                    ...contact,
                    Cards
                });
                contactEncryptionAddressMap.init(scope.contact.ID, item.vCard);
                scope.$applyAsync(() => {
                    scope.contact = item;
                });
                return item;
            };

            load();

            on('contacts', (e, { type, data = {} }) => {
                type === 'selectContacts' && selectContacts();
                type === 'action.input' && changeMode(data);

                /*
                    If you update a contact ex via adding a group we refresh
                    the view based on a config send POST cache update inside ContactCache.
                 */
                if (type === 'contactsUpdated' && data.todo) {
                    const { update = [] } = data.todo;
                    const contact = update.find(({ ID }) => scope.contact.ID === ID);

                    contact && updateContact({ contact, cards: contact.Cards });
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
