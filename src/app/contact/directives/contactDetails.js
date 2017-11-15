angular.module('proton.contact')
    .directive('contactDetails', (
        $compile,
        $filter,
        $rootScope,
        $state,
        CONSTANTS,
        Contact,
        contactDetailsModel,
        contactDownloader,
        contactBeforeToLeaveModal,
        contactSchema,
        contactTransformLabel,
        gettextCatalog,
        notification,
        subscriptionModel,
        vcard
    ) => {
        const ENCRYPTED_AND_SIGNED = 'contactDetails-encrypted-and-signed';
        const HAS_ERROR_VERIFICATION = 'contactDetails-verification-error';
        const HAS_ERROR_ENCRYPTED = 'contactDetails-encrypted-error';
        const HAS_ERROR_VERIFICATION_ENCRYPTED = 'contactDetails-encrypted-verification-error';

        const I18N = {
            invalidForm: gettextCatalog.getString('This form is invalid', null, 'Error displays when the user try to leave an unsaved and invalid contact details')
        };

        return {
            restrict: 'E',
            replace: true,
            scope: { contact: '=', modal: '=' },
            templateUrl: 'templates/contact/contactDetails.tpl.html',
            link(scope, element) {
                const unsubscribe = [];
                const updateType = (types = []) => _.contains(types, CONSTANTS.CONTACT_MODE.ENCRYPTED_AND_SIGNED) && element.addClass(ENCRYPTED_AND_SIGNED);
                const onSubmit = () => saveContact();
                const isFree = !subscriptionModel.hasPaid('mail');
                const properties = vcard.extractProperties(scope.contact.vCard);
                const hasEmail = _.filter(properties, (property) => property.getField() === 'email').length;

                scope.model = {};
                scope.state = {
                    encrypting: false,
                    ID: scope.contact.ID,
                    hasEmail,
                    isFree
                };

                unsubscribe.push($rootScope.$on('contacts', (event, { type = '', data = {} }) => {
                    if (scope.modal && type === 'submitContactForm') {
                        scope.contactForm.$setSubmitted(true);
                        onSubmit();
                    }

                    if (type === 'contactUpdated' && data.contact.ID === scope.contact.ID) {
                        updateType(data.cards.map(({ Type }) => Type));
                    }
                }));

                unsubscribe.push($rootScope.$on('$stateChangeStart', (event, toState, toParams) => {
                    if (!scope.modal && scope.contactForm.$dirty) {
                        event.preventDefault();
                        saveBeforeToLeave(toState, toParams);
                    }
                }));

                // If the contact is signed we display an icon
                updateType(scope.contact.types);

                if (scope.contact.errors) {
                    scope.contact.errors.indexOf(3) !== -1 && element.addClass(HAS_ERROR_VERIFICATION_ENCRYPTED);
                    scope.contact.errors.indexOf(2) !== -1 && element.addClass(HAS_ERROR_ENCRYPTED);
                    scope.contact.errors.indexOf(1) !== -1 && element.addClass(HAS_ERROR_VERIFICATION);
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

                function onClick(event) {
                    const action = event.target.getAttribute('data-action');

                    switch (action) {
                        case 'deleteContact':
                            $rootScope.$emit('contacts', { type: 'deleteContacts', data: { contactIDs: [scope.contact.ID] } });
                            break;
                        case 'downloadContact':
                            $rootScope.$emit('contacts', { type: 'exportContacts', data: { contactID: scope.contact.ID } });
                            break;
                        case 'back':
                            $state.go('secured.contacts');
                            break;
                        default:
                            break;
                    }
                }

                /**
                 * Send event to create / update contact
                 * @return {Boolean}
                 */
                function saveContact() {

                    if (scope.contactForm.$invalid) {
                        notification.error(I18N.invalidForm);
                        return false;
                    }

                    const contact = contactDetailsModel.prepare(scope);

                    if (scope.contact.ID) {
                        contact.ID = scope.contact.ID;
                        $rootScope.$emit('contacts', { type: 'updateContact', data: { contact } });
                    } else {
                        $rootScope.$emit('contacts', { type: 'createContact', data: { contacts: [contact] } });
                    }

                    scope.contactForm.$setPristine(true);

                    return true;
                }

                // Methods
                scope.get = (type) => {
                    const vcard = scope.contact.vCard;

                    switch (type) {
                        case 'Name':
                            return contactDetailsModel.extract({ vcard, field: 'FN' });
                        case 'Emails':
                            return contactDetailsModel.extract({ vcard, field: 'EMAIL' });
                        case 'Tels':
                            return contactDetailsModel.extract({ vcard, field: 'TEL' });
                        case 'Adrs':
                            return contactDetailsModel.extract({ vcard, field: 'ADR' });
                        case 'Personals':
                            return contactDetailsModel.extract({ vcard, field: 'PERSONALS' });
                        case 'Customs':
                            return contactDetailsModel.extract({ vcard, field: 'CUSTOMS' });
                        case 'Notes':
                            return contactDetailsModel.extract({ vcard, field: 'NOTE' });
                        default:
                            break;
                    }
                };

                scope.$on('$destroy', () => {
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                    element.off('click', onClick);
                    element.off('submit', onSubmit);
                });
            }
        };
    });
