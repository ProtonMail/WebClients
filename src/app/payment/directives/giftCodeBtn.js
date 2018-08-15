/* @ngInject */
function giftCodeBtn(dispatchers, giftCodeModal) {
    const { dispatcher } = dispatchers(['signup']);
    const dispatch = (type) => dispatcher.signup(type);

    return {
        templateUrl: require('../../../templates/payment/giftCodeBtn.tpl.html'),
        restrict: 'E',
        replace: true,
        scope: {},
        link(scope, element, { action }) {
            const onClick = () => {
                if (action === 'modal') {
                    giftCodeModal.activate({
                        params: {
                            close() {
                                giftCodeModal.deactivate();
                            }
                        }
                    });
                }

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
