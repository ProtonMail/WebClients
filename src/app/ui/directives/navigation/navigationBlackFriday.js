import { CYCLE } from '../../../constants';

const { MONTHLY } = CYCLE;

/* @ngInject */
function navigationBlackFriday($stateParams, blackFridayModal, blackFridayModel, subscriptionModel) {
    const onClick = () => {
        blackFridayModal.activate({
            params: {
                close() {
                    blackFridayModal.deactivate();
                }
            }
        });
    };

    return {
        restrict: 'E',
        scope: {},
        replace: true,
        templateUrl: require('../../../../templates/ui/navigation/navigationBlackFriday.tpl.html'),
        link(scope, element) {
            const isFree = !subscriptionModel.hasPaid('mail');
            const isMonthly = subscriptionModel.cycle() === MONTHLY;
            const afterSignup = $stateParams.welcome;

            if (blackFridayModel.isBlackFridayPeriod(false) && (isFree || isMonthly) && !afterSignup) {
                onClick();
            }

            element.on('click', onClick);

            scope.$on('$destroy', () => {
                element.off('click', onClick);
            });
        }
    };
}
export default navigationBlackFriday;
