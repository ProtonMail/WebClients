angular.module('proton.controllers.Settings')

.controller('MethodsController', function(
    $scope,
    $translate,
    cardModal,
    confirmModal,
    methods,
    notify
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
        confirmModal.activate({
            params: {
                title: $translate.instant('DELETE_PAYMENT_METHOD'),
                message: $translate.instant('Are you sure you want to delete this payment method?'),
                confirm: function() {
                    Payment.deleteMethod(method.ID)
                    .then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            confirmModal.deactivate();
                            $scope.methods.splice($scope.methods.indexOf(method), 1);
                            notify({message: $translate.instant('PAYMENT_METHOD_DELETED'), classes: 'notification-danger'});
                        }
                    });
                }
            }
        });
    };
});
