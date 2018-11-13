import _ from 'lodash';
import { flow, values, reduce } from 'lodash/fp';

import { CONTACT_MODE } from '../../constants';
import { extractAll as extractAllProperties } from '../../../helpers/vCardProperties';

const { ENCRYPTED_AND_SIGNED, ENCRYPTED, SIGNED } = CONTACT_MODE;

/* @ngInject */
function contactDetails(
    $state,
    AppModel,
    contactDetailsModel,
    contactBeforeToLeaveModal,
    contactEncryptionModal,
    gettextCatalog,
    notification,
    subscriptionModel,
    memberModel,
    dispatchers
) {
    const ENCRYPTED_AND_SIGNED_CLASS = 'contactDetails-encrypted-and-signed';

    const I18N = {
        invalidForm: gettextCatalog.getString(
            'This form is invalid',
            null,
            'Error displays when the user try to leave an unsaved and invalid contact details'
        )
    };

    return {
        restrict: 'E',
        replace: true,
        priority: 200,
        scope: {
            contact: '=',
            modal: '=',
            mode: '='
        },
        templateUrl: require('../../../templates/contact/contactDetails.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe, dispatcher } = dispatchers(['contacts']);

            const updateType = (types = []) => {
                if ([ENCRYPTED_AND_SIGNED, SIGNED, ENCRYPTED].some((type) => types.indexOf(type) !== -1)) {
                    return element.addClass(ENCRYPTED_AND_SIGNED_CLASS);
                }
                element.removeClass(ENCRYPTED_AND_SIGNED_CLASS);
            };

            const onSubmit = () => saveContact();
            const isFree = !subscriptionModel.hasPaid('mail') && !memberModel.isMember();
            const properties = extractAllProperties(scope.contact.vCard);
            const hasEmail = _.filter(properties, (property) => property.getField() === 'email').length;

            // Focus the details
            element.find('.contactDetails-details').focus();

            scope.model = {};
            scope.state = {
                encrypting: false,
                ID: scope.contact.ID,
                hasEmail,
                isFree
            };

            // If the contact is signed we display an icon
            updateType(scope.contact.types);

            function saveBeforeToLeave(toState, toParams) {
                contactBeforeToLeaveModal.activate({
                    params: {
                        confirm() {
                            contactBeforeToLeaveModal.deactivate();

                            if (saveContact({ toState, toParams })) {
                                $state.go(toState.name, toParams);
                            }
                        },
                        discard() {
                            contactBeforeToLeaveModal.deactivate();
                            scope.contactForm.$setPristine(true);
                            $state.go(toState.name, toParams);
                        }
                    }
                });
            }

            function isValidForm() {
                if (scope.contactForm.$invalid) {
                    return false;
                }

                const valuesArray = flow(
                    values,
                    reduce((acc, child = []) => acc.concat(child.filter(({ value = '' }) => value)), [])
                )(scope.model);

                return valuesArray.length;
            }

            /**
             * Send event to create / update contact
             * @return {Boolean}
             */
            function saveContact(state = {}) {
                if (!isValidForm()) {
                    notification.error(I18N.invalidForm);
                    return false;
                }

                const contact = contactDetailsModel.prepare(scope);

                if (scope.contact.ID) {
                    contact.ID = scope.contact.ID;
                    // Close edition mode
                    const callback = ({ Contact, cards } = {}) => {
                        dispatcher.contacts('action.input', {
                            action: 'toggleMode',
                            current: scope.mode,
                            refresh: true,
                            contact: Contact,
                            cards
                        });
                    };
                    dispatcher.contacts('updateContact', { contact, callback });
                } else {
                    dispatcher.contacts('createContact', { contacts: [contact], state });
                }

                scope.$applyAsync(() => {
                    scope.contactForm.$setSubmitted(true);
                    scope.contactForm.$setPristine(true);
                });

                return true;
            }

            element.on('submit', onSubmit);

            on('contacts', (event, { type = '', data = {} }) => {
                if (scope.modal && type === 'submitContactForm') {
                    saveContact();
                }

                if (type === 'contactBeforeToLeaveModal' && data.choice === 'confirm') {
                    saveContact();
                }

                if (type === 'contactUpdated' && data.contact.ID === scope.contact.ID) {
                    updateType(data.cards.map(({ Type }) => Type));
                }
            });

            on('hotkeys', (e, { type = '' }) => {
                if (type === 'save' && !AppModel.get('activeComposer')) {
                    saveContact();
                }
            });

            on('$stateChangeStart', (event, toState, toParams) => {
                // Do not ask for contacts that are new
                if (!scope.state.ID) {
                    return;
                }
                if (scope.contactForm.$dirty) {
                    event.preventDefault();
                    saveBeforeToLeave(toState, toParams);
                }
            });

            scope.$on('$destroy', () => {
                element.off('submit', saveContact);
                unsubscribe();

                /*
                 * close the advanced modal on back
                 * no need to check if it's active, the deactivate function does that for you
                 */
                contactEncryptionModal.deactivate();
            });
        }
    };
}
export default contactDetails;
