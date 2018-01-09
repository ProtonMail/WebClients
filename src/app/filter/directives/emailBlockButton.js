/* @ngInject */
function emailBlockButton(filterAddressModal) {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/filter/emailBlockButton.tpl.html'),
        scope: {},
        link(scope, elem, { targetList }) {
            const onClick = () => {
                filterAddressModal.activate({
                    params: {
                        type: targetList,
                        close() {
                            filterAddressModal.deactivate();
                        }
                    }
                });
            };

            elem.on('click', onClick);

            scope.$on('$destroy', () => {
                elem.off('click', onClick);
            });
        }
    };
}
export default emailBlockButton;
