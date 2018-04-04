import _ from 'lodash';

/* @ngInject */
function trustPublicKeyTable() {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/message/trustPublicKeyTable.tpl.html'),
        scope: {
            addresses: '='
        },
        link(scope, elem) {
            const addAddress = () =>
                scope.$applyAsync(() => {
                    scope.addresses.push({ adr: '', name: '', infoText: '' });
                });

            const deleteAddress = (index) =>
                scope.$applyAsync(() => {
                    scope.addresses.splice(index, 1);
                    if (scope.addresses.length === 0) {
                        scope.addresses.push({ adr: '', name: '', infoText: '' });
                    }
                });

            const ACTIONS = {
                addAddress,
                deleteAddress
            };

            const onClick = ({ target }) => {
                if (target.nodeName !== 'BUTTON') {
                    return;
                }

                const { action = '', index = 0 } = target.dataset;

                if (_.has(ACTIONS, action)) {
                    ACTIONS[action](parseInt(index, 10));
                }
            };

            elem[0].addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                elem[0].removeEventListener('click', onClick);
            });
        }
    };
}
export default trustPublicKeyTable;
