/* @ngInject */
function giftCodeBtn(dispatchers) {
    const { dispatcher } = dispatchers(['signup']);
    const dispatch = (type) => dispatcher.signup(type);

    return {
        templateUrl: require('../../../templates/payment/giftCodeBtn.tpl.html'),
        restrict: 'E',
        replace: true,
        scope: {},
        link(scope, element, { action }) {
            const onClick = () => {
                if (action === 'displayGiftSignup') {
                    dispatch(action);
                }
            };

            element.on('click', onClick);

            scope.$on('$destroy', () => {
                element.off('click', onClick);
            });
        }
    };
}
export default giftCodeBtn;
