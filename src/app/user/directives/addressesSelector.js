import _ from 'lodash';

/* @ngInject */
function addressesSelector(addressesModel, dispatchers) {
    const buildOptions = () => _.map(addressesModel.get(), ({ ID = '', Email = '' }) => `<option class="addressesSelector-option" value="${ID}">${Email}</option>`);
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/addressesSelector.tpl.html'),
        link(scope, el) {
            const $select = el.find('.addressesSelector-select');
            const { dispatcher, on, unsubscribe } = dispatchers(['changeAddressSelection']);
            const onChange = ({ target }) => dispatcher.changeAddressSelection({ ID: target.value });

            $select[0].innerHTML = buildOptions();

            $select.on('change', onChange);
            on('addressesModel', (e, { type = '' }) => {
                if (type === 'addresses.updated') {
                    $select[0].innerHTML = buildOptions();
                }
            });

            scope.$on('$destroy', () => {
                $select.off('change', onChange);
                unsubscribe();
            });
        }
    };
}
export default addressesSelector;
