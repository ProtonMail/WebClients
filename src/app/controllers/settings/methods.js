angular.module('proton.controllers.Settings')

.controller('MethodsController', function(
    $scope,
    cardModal,
    methods
) {
    $scope.methods = methods.data.PaymentMethods;

    $scope.add = function() {
        cardModal.activate({
            params: {
                cancel: function() {
                    cardModal.deactivate();
                }
            }
        });
    };

    $scope.edit = function(method) {
        cardModal.activate({
            params: {
                method: method,
                cancel: function() {
                    cardModal.deactivate();
                }
            }
        });
    };

    $scope.delete = function(method) {
        Payment.deleteMethod(method.ID);
        $scope.methods.splice($scope.methods.indexOf(method), 1);
    };
});
