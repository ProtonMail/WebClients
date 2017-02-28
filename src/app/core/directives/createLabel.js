angular.module('proton.core')
.directive('createLabel', ($rootScope, labelModal) => {
    const dispatch = (message, label = {}) => {
        $rootScope.$emit('messageActions', {
            action: 'label',
            data: {
                messages: [message],
                labels: [_.extend({}, label, { Selected: true })]
            }
        });
    };

    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/createLabel.tpl.html',
        scope: {
            name: '=labelName',
            message: '='
        },
        link(scope) {
            scope.create = () => {
                labelModal.activate({
                    params: {
                        label: { Name: scope.name, Exclusive: 0 },
                        close(label) {
                            labelModal.deactivate();
                            scope.message && label && dispatch(scope.message, label);
                        }
                    }
                });
            };
        }
    };
});
