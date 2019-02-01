import { CONTACT_ERROR } from '../../errors';

const { TYPE3_CONTACT_VERIFICATION, TYPE2_CONTACT_VERIFICATION, TYPE3_CONTACT_DECRYPTION } = CONTACT_ERROR;

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
    const toClass = (key) => `contactErrorType-${key}-error`;

    const testErrors = ({ errors = [] } = {}) => ({
        [toClass('encrypted-verification')]: errors.includes(TYPE3_CONTACT_VERIFICATION),
        [toClass('encrypted')]: errors.includes(TYPE3_CONTACT_DECRYPTION),
        [toClass('verification')]: errors.includes(TYPE2_CONTACT_VERIFICATION)
    });

    return {
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/contact/contactRightPanel.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe, dispatcher } = dispatchers(['contacts']);

            scope.mode = 'view';
            scope.testErrors = testErrors;

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
                /*
                    When we update the contact to ensure we refresh it with
                    the updated data on toggle mode, we wait for the updateContact event.
                    (when this action ocure, we're processing this event).
                 */
                if (action !== 'toggleMode') {
                    return;
                }

                const mode = forceRefresh ? scope.mode : getMode(current);

                scope.$applyAsync(() => {
                    if (!isSameContact(ID)) {
                        // Not the same contact
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

                    if (contact) {
                        updateContact({ contact, cards: contact.Cards }).then((contact) => {
                            // Refresh the current contact when we update it
                            changeMode({
                                contact,
                                action: 'toggleMode',
                                current: 'edition'
                            });
                        });
                    }
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
