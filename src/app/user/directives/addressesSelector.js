import _ from 'lodash';

/* @ngInject */
function addressesSelector($rootScope, authentication) {
    const buildOptions = () => {
        const { Addresses = [] } = authentication.user || {};
        return _.map(Addresses, ({ ID = '', Email = '' }) => `<option class="addressesSelector-option" value="${ID}">${Email}</option>`);
    };
    const onChange = ({ target }) => $rootScope.$emit('changeAddressSelection', { ID: target.value });
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/addressesSelector.tpl.html'),
        compile(el) {
            const $select = el.find('.addressesSelector-select');

            $select[0].innerHTML = buildOptions();

            return (scope) => {
                $select.on('change', onChange);
                scope.$on('$destroy', () => {
                    $select.off('change', onChange);
                });
            };
        }
    };
}
export default addressesSelector;
