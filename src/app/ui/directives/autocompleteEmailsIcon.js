/* @ngInject */
function autocompleteEmailsIcon(dispatchers, tooltipModel, encryptionStatus) {
    return {
        replace: true,
        templateUrl: require('../../../templates/ui/autoCompleteEmailsIcon.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const refreshTooltip = () => {
                const title = encryptionStatus.getTooltip(scope.email);
                tooltipModel.update(el, { title });
            };

            on('composerInputRecipient', (event, { type, data: { email } }) => {
                if (type !== 'refresh' && email.Address !== scope.email.Address) {
                    return;
                }
                scope.$applyAsync(() => {
                    refreshTooltip();
                });
            });

            on('autocompleteEmails', (event, { type, data: { messageID } }) => {
                if (type !== 'refresh' && messageID !== scope.message.ID) {
                    return;
                }
                scope.$applyAsync(() => {
                    refreshTooltip();
                });
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default autocompleteEmailsIcon;
