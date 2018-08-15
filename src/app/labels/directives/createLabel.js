import _ from 'lodash';

/* @ngInject */
function createLabel(dispatchers, labelModal) {
    const { dispatcher } = dispatchers(['messageActions']);
    const dispatch = (message, label = {}) => {
        dispatcher.messageActions('label', {
            messages: [message],
            labels: [_.extend({}, label, { Selected: true })]
        });
    };

    return {
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/labels/createLabel.tpl.html'),
        scope: {
            name: '=labelName',
            message: '='
        },
        link(scope, el) {
            const onClick = () => {
                labelModal.activate({
                    params: {
                        label: {
                            Name: scope.name,
                            Exclusive: 0
                        },
                        close(label) {
                            labelModal.deactivate();
                            scope.message && label && dispatch(scope.message, label);
                        }
                    }
                });
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default createLabel;
