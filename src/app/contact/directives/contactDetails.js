import _ from 'lodash';
import { flow, values, reduce } from 'lodash/fp';
import { CONTACT_MODE, CONTACT_ERROR } from '../../constants';

const { ENCRYPTED_AND_SIGNED, ENCRYPTED, SIGNED } = CONTACT_MODE;
const { TYPE3_CONTACT_VERIFICATION, TYPE2_CONTACT_VERIFICATION, TYPE3_CONTACT_DECRYPTION } = CONTACT_ERROR;

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
    dispatchers,
    vcard
) {
    const ENCRYPTED_AND_SIGNED_CLASS = 'contactDetails-encrypted-and-signed';
    const HAS_ERROR_VERIFICATION = 'contactDetails-verification-error';
    const HAS_ERROR_ENCRYPTED = 'contactDetails-encrypted-error';
    const HAS_ERROR_VERIFICATION_ENCRYPTED = 'contactDetails-encrypted-verification-error';

    const MAP_FIELDS = {
        Name: 'FN',
        Emails: 'EMAIL',
        Tels: 'TEL',
        Adrs: 'ADR',
        Notes: 'NOTE',
        Photos: 'PHOTO'
    };

    const MAP_EVENT = {
        deleteContact({ ID }) {
            return { type: 'deleteContacts', data: { contactIDs: [ID] } };
        },
        downloadContact({ ID }) {
            return { type: 'exportContacts', data: { contactID: ID } };
        }
    };

    const I18N = {
        invalidForm: gettextCatalog.getString(
            'This form is invalid',
            null,
            'Error displays when the user try to leave an unsaved and invalid contact details'
        )
    };

    const getFieldKey = (type = '') => MAP_FIELDS[type] || type.toUpperCase();

    return {
        restrict: 'E',
        replace: true,
        scope: { contact: '=', modal: '=' },
        templateUrl: require('../../../templates/contact/contactDetails.tpl.html'),
        link(scope, element) {
            const { on, unsubscribe, dispatcher } = dispatchers(['contacts']);

            const dispatch = (type, data = {}) => {
                const opt = (MAP_EVENT[type] || _.noop)(data) || { type, data };
                dispatcher.contacts(opt.type, opt.data);
            };

            const updateType = (types = []) => {
                if ([ENCRYPTED_AND_SIGNED, SIGNED, ENCRYPTED].some((type) => types.indexOf(type) !== -1)) {
                    element.addClass(ENCRYPTED_AND_SIGNED_CLASS);
                    return;
                }
                element.removeClass(ENCRYPTED_AND_SIGNED_CLASS);
            };

            const onSubmit = () => saveContact();
            const isFree = !subscriptionModel.hasPaid('mail') && !memberModel.isMember();
            const properties = vcard.extractProperties(scope.contact.vCard);
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

            on('contacts', (event, { type = '', data = {} }) => {
                if (scope.modal && type === 'submitContactForm') {
                    onSubmit();
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
                if (!scope.modal && scope.contactForm.$dirty) {
                    event.preventDefault();
                    saveBeforeToLeave(toState, toParams);
                }
            });

            // If the contact is signed we display an icon
            updateType(scope.contact.types);

            if (scope.contact.errors) {
                scope.contact.errors.indexOf(TYPE3_CONTACT_VERIFICATION) !== -1 && element.addClass(HAS_ERROR_VERIFICATION_ENCRYPTED);
                scope.contact.errors.indexOf(TYPE3_CONTACT_DECRYPTION) !== -1 && element.addClass(HAS_ERROR_ENCRYPTED);
                scope.contact.errors.indexOf(TYPE2_CONTACT_VERIFICATION) !== -1 && element.addClass(HAS_ERROR_VERIFICATION);
            }

            element.on('click', onClick);
            element.on('submit', onSubmit);

            // Functions
            function saveBeforeToLeave(toState, toParams) {
                contactBeforeToLeaveModal.activate({
                    params: {
                        save() {
                            contactBeforeToLeaveModal.deactivate();

                            if (saveContact()) {
                                $state.go(toState.name, toParams);
                            }
                        },
                        discard() {
                            contactBeforeToLeaveModal.deactivate();
                            scope.contactForm.$setPristine(true);
                            $state.go(toState.name, toParams);
                        },
                        cancel() {
                            contactBeforeToLeaveModal.deactivate();
                        }
                    }
                });
            }

            function onClick({ target }) {
                const action = target.getAttribute('data-action');

                if (!action) {
                    return;
                }

                action === 'back' && $state.go('secured.contacts');
                dispatch(action, scope.contact);
            }

            function isValidForm() {
                if (scope.contactForm.$invalid) {
                    return false;
                }

                const valuesArray = flow(values, reduce((acc, child = []) => acc.concat(child.filter(({ value = '' }) => value)), []))(scope.model);

                return valuesArray.length;
            }

            /**
             * Send event to create / update contact
             * @return {Boolean}
             */
            function saveContact() {
                if (!isValidForm()) {
                    notification.error(I18N.invalidForm);
                    return false;
                }

                const contact = contactDetailsModel.prepare(scope);

                if (scope.contact.ID) {
                    contact.ID = scope.contact.ID;
                    dispatch('updateContact', { contact });
                } else {
                    dispatch('createContact', { contacts: [contact] });
                }

                scope.contactForm.$setSubmitted(true);
                scope.contactForm.$setPristine(true);
                return true;
            }

            scope.get = (type) => {
                const vcard = scope.contact.vCard;

                if (type) {
                    return contactDetailsModel.extract({
                        vcard,
                        field: getFieldKey(type)
                    });
                }
            };

            scope.$on('$destroy', () => {
                element.off('click', onClick);
                element.off('submit', onSubmit);
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
