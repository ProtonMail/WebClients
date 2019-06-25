/* @ngInject */
function unsubscribePanel(
    addressesModel,
    confirmModal,
    dispatchers,
    gettextCatalog,
    notification,
    unsubscribeModel,
    translator
) {
    const I18N = translator(() => ({
        cannotSend(email) {
            return gettextCatalog.getString(
                'Cannot unsubscribe with {{email}}, please upgrade to a paid plan or enable the address',
                { email },
                'Error message when unsubscribing to mail list'
            );
        },
        notice: gettextCatalog.getString('This message is from a mailing list', null, 'Info'),
        kb: gettextCatalog.getString('Learn more', null, 'Info'),
        button: gettextCatalog.getString('Unsubscribe', null, 'Action'),
        title: gettextCatalog.getString('Unsubscribe from mailing list?', null, 'Title'),
        message(email) {
            return gettextCatalog.getString(
                'We will send a message from {{email}} to unsubscribe from this mailing list.',
                { email: `<b>${email}</b>` },
                'Info'
            );
        }
    }));

    const { dispatcher } = dispatchers(['message']);

    const confirmFirst = (message) => {
        const address = addressesModel.getByEmail(message.xOriginalTo);

        if (!address.Send) {
            return notification.error(I18N.cannotSend(message.xOriginalTo));
        }

        confirmModal.activate({
            params: {
                title: I18N.title,
                message: I18N.message(message.xOriginalTo),
                confirm() {
                    confirmModal.deactivate();
                    dispatcher.message('unsubscribe', { message });
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
                <div class="bg-white w100 rounded bordered-container p0-5 mb0-5 flex flex-nowrap">
                    <icon data-name="email" data-size="16" class=" fill-global-grey mtauto mbauto"></icon>
                    <span class="pl0-5 pr0-5 flex-item-fluid">${I18N.notice}</span>
                    <a class="bold mr1" href="https://protonmail.com/support/knowledge-base/auto-unsubscribe" target="_blank">${
                        I18N.kb
                    }</a>
                    <button type="button" class="unsubscribePanel-button link underline bold">${I18N.button}</button>
                </div>
            `,
        link(scope, element) {
            const $button = element.find('.unsubscribePanel-button');
            const onClick = () => {
                if (unsubscribeModel.beginsWith(scope.message, 'mailto:')) {
                    confirmFirst(scope.message);
                } else {
                    dispatcher.message('unsubscribe', { message: scope.message });
                }
            };

            $button.on('click', onClick);
            scope.$on('$destroy', () => $button.off('click', onClick));
        }
    };
}
export default unsubscribePanel;
