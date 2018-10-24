import tooltipModel from '../../utils/helpers/tooltipHelper';

/* @ngInject */
function encryptionStatus(dispatchers) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/message/encryptionStatus.tpl.html'),
        link(scope, el) {
            const { on, unsubscribe } = dispatchers();
            const tooltip = tooltipModel(el, { title: scope.message.encryptionType() });

            on('tooltip', (e, { type, data = {} }) => {
                if (type === 'reloadEncryptionTooltip' && scope.message.ID === data.messageID) {
                    tooltip.updateTitleContent(scope.message.encryptionType());
                }

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
export default encryptionStatus;
