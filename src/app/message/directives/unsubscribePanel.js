angular.module('proton.message')
    .directive('unsubscribePanel', ($rootScope, authentication, confirmModal, gettextCatalog) => {
        const I18N = {
            notice: gettextCatalog.getString('This message is from a mailing list.', null, 'Info'),
            kb: gettextCatalog.getString('Learn more', null, 'Info'),
            button: gettextCatalog.getString('Unsubscribe', null, 'Action'),
            title: gettextCatalog.getString('Unsubscribe from mailing list?', null, 'Title'),
            message(email) {
                return gettextCatalog.getString('We will send a message from {{email}} and/or open a new tab to unsubscribe from this mailing list.', { email: `<b>${email}</b>` }, 'Info');
            }
        };

        const confirm = (message) => {
            const { Email } = _.findWhere(authentication.user.Addresses, { ID: message.AddressID }) || authentication.user.Addresses[0];

            confirmModal.activate({
                params: {
                    title: I18N.title,
                    message: I18N.message(Email),
                    confirm() {
                        confirmModal.deactivate();
                        $rootScope.$emit('message', { type: 'unsubscribe', data: { message } });
                    },
                    cancel() {
                        confirmModal.deactivate();
                    }
                }
            });
        };

        return {
            replace: true,
            restrict: 'E',
            template: `
                <div class="unsubscribePanel-container">
                    <div class="unsubscribePanel-notice">
                        <span class="unsubscribePanel-notice-text">${I18N.notice}</span>
                        <a class="unsubscribePanel-notice-link" href="https://protonmail.com/support/knowledge-base/auto-unsubscribe" target="_blank">${I18N.kb}</a>
                    </div>
                    <button type="button" class="unsubscribePanel-button pm_button">${I18N.button}</button>
                </div>
            `,
            link(scope, element) {
                const $button = element.find('.unsubscribePanel-button');
                const onClick = () => confirm(scope.message);

                $button.on('click', onClick);
                scope.$on('$destroy', () => $button.off('click', onClick));
            }
        };
    });
