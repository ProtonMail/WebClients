/* @ngInject */
function contactActionHeader(dispatchers, $state, contactBeforeToLeaveModal) {
    const { dispatcher } = dispatchers(['contacts']);

    // Ask to the user if he wants to reset the changes made
    const confirmation = (dispatcher) => {
        return new Promise((resolve) => {
            const action = (choice) => () => {
                dispatcher.contacts('contactBeforeToLeaveModal', { choice });
                contactBeforeToLeaveModal.deactivate();
                resolve(choice !== 'discard');
            };
            contactBeforeToLeaveModal.activate({
                params: {
                    confirm: action('confirm'),
                    discard: action('discard')
                }
            });
        });
    };

    return {
        scope: {
            contactForm: '=form',
            contact: '=',
            mode: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/contact/contactActionHeader.tpl.html'),
        link(scope, el) {
            const EVENTS = {
                toggleMode() {
                    return [
                        'action.input',
                        {
                            action: 'toggleMode',
                            current: scope.mode,
                            contact: scope.contact
                        }
                    ];
                },
                downloadContact({ ID: contactID }) {
                    return ['exportContacts', { contactID }];
                },
                deleteContact({ ID }) {
                    return ['deleteContacts', { contactIDs: [ID] }];
                }
            };

            const onClick = async ({ target }) => {
                const action = target.getAttribute('data-action');
                if (target.nodeName !== 'BUTTON' || !action) {
                    return;
                }

                if (action === 'back') {
                    return $state.go('secured.contacts');
                }

                if (scope.contactForm && scope.contactForm.$dirty) {
                    if (await confirmation(dispatcher)) {
                        return;
                    }
                }

                dispatcher.contacts.apply(null, EVENTS[action](scope.contact));
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default contactActionHeader;
