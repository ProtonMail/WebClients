/* @ngInject */
function featuresList($state, paymentModal) {
    const IS_PLUS = 'featuresList-isPlus';
    const IS_PROFESSIONAL = 'featuresList-isProfessional';
    const IS_VISIONARY = 'featuresList-isVisionary';
    const HAS_VPN = 'featuresList-hasVPN';

    function onClick(event) {
        const target = event.target;

        if (target.nodeName === 'BUTTON') {
            const route = target.getAttribute('data-route');

            paymentModal.deactivate();
            $state.go(route);
        }
    }

    return {
        restrict: 'E',
        scope: { ctrl: '=' },
        replace: true,
        templateUrl: require('../../../templates/payment/featuresList.tpl.html'),
        link(scope, element) {
            const MAP = scope.ctrl.plans.reduce((acc, plan) => {
                acc[plan.Name] = plan.Name;
                return acc;
            }, {});

            element.on('click', onClick);
            MAP.plus && element.addClass(IS_PLUS);
            MAP.professional && element.addClass(IS_PROFESSIONAL);
            MAP.visionary && element.addClass(IS_VISIONARY);
            (MAP.vpnbasic || MAP.vpnplus) && element.addClass(HAS_VPN);

            scope.$on('$destroy', () => element.off('click', onClick));
        }
    };
}
export default featuresList;
