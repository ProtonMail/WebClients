import tooltipModel from '../../utils/helpers/tooltipHelper';

/* @ngInject */
function autocompleteEmailsIcon(encryptionStatus, dispatchers) {
    return {
        replace: true,
        scope: {
            email: '<',
            message: '<'
        },
        templateUrl: require('../../../templates/ui/autoCompleteEmailsIcon.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const tooltip = tooltipModel(el, { title: encryptionStatus.getTooltip(scope.email) });

            const refreshTooltip = (email) => {
                tooltip.updateTitleContent(encryptionStatus.getTooltip(email));
            };

            // Ensure the tooltip is updated once the model updates.
            on('autocompleteEmails', (event, { type, data: { messageID } }) => {
                if (type === 'refresh' && messageID === scope.message.ID) {
                    refreshTooltip(scope.email);
                }
            });

            on('tooltip', (e, { type }) => {
                if (type === 'hideAll') {
                    tooltip.hide();
                }
            });

            scope.$on('$destroy', () => {
                tooltip.dispose();
                unsubscribe();
            });
        }
    };
}

export default autocompleteEmailsIcon;
