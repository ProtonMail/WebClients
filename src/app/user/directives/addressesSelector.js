import _ from 'lodash';

/* @ngInject */
function addressesSelector(addressesModel, dispatchers) {
    const buildOptions = () =>
        _.map(
            addressesModel.get(),
            ({ ID = '', Email = '' }) => `<option class="addressesSelector-option" value="${ID}">${Email}</option>`
        );
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/addressesSelector.tpl.html'),
        link(scope, el) {
            const $select = el.find('.addressesSelector-select');
            const { dispatcher, on, unsubscribe } = dispatchers(['addressSelection']);
            const onChange = ({ target }) => dispatcher.addressSelection('change', { ID: target.value });
            const updateSelect = () => {
                const index = $select[0].selectedIndex;

                $select[0].innerHTML = buildOptions();
                $select[0].selectedIndex = Math.max(0, index); // NOTE Make sure we don't use negative value because `selectedIndex` can equals `-1` the first time, when options doesn't exist yet
            };

            updateSelect();

            $select.on('change', onChange);

            on('addressesModel', (e, { type = '' }) => {
                if (type === 'addresses.updated') {
                    updateSelect();
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
