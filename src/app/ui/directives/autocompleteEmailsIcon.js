/* @ngInject */
function autocompleteEmailsIcon(tooltipModel, encryptionStatus, dispatchers) {
    return {
        replace: true,
        scope: {
            email: '<',
            message: '<'
        },
        templateUrl: require('../../../templates/ui/autoCompleteEmailsIcon.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();

            const refreshTooltip = (email) => {
                const title = encryptionStatus.getTooltip(email);
                tooltipModel.update(el, { title });
            };

            const setTooltip = (email) => {
                const title = encryptionStatus.getTooltip(email);
                tooltipModel.add(el, { title });
            };

            setTooltip(scope.email);

            // Ensure the tooltip is updated once the model updates.
            on('autocompleteEmails', (event, { type, data: { messageID } }) => {
                if (type !== 'refresh' && messageID !== scope.message.ID) {
                    return;
                }
                refreshTooltip(scope.email);
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}

export default autocompleteEmailsIcon;
