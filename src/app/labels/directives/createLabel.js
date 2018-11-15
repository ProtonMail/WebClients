/* @ngInject */
function createLabel(dispatchers, labelModal) {
    const { dispatcher } = dispatchers(['dropdown', 'createLabel', 'messageActions']);
    const dispatch = (message, label = {}) => {
        if (message) {
            dispatcher.messageActions('label', {
                messages: [message],
                labels: [{ ...label, Selected: true }]
            });
            dispatcher.dropdown('close');
            return;
        }

        dispatcher.createLabel('new.label', { label });
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
                            label && dispatch(scope.message, label);
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
