angular.module('proton.controllers.Settings')

.controller('PaymentsController', function(
    $scope,
    $translate,
    $q,
    authentication,
    cardModal,
    payModal,
    confirmModal,
    invoices,
    methods,
    notify,
    networkActivityTracker,
    Payment
) {
    $scope.methods = methods.data.PaymentMethods;
    $scope.subscribed = authentication.user.Subscribed === 1;
    $scope.invoices = invoices.data.Invoices;
    $scope.total = invoices.data.Total;

    $scope.refresh = function() {
        networkActivityTracker.track(Payment.methods()
        .then(function(result) {
            if (result.data && result.data.Code === 1000) {
                $scope.methods = result.data.PaymentMethods;
            }
        }));
    };

    $scope.add = function() {
        cardModal.activate({
            params: {
                close: function(method) {
                    cardModal.deactivate();

                    if (angular.isDefined(method)) {
                        // Add the new method to the top of the methods list
                        // Because this new payment method is marked as default
                        $scope.methods.unshift(method);
                    }
                }
            }
        });
    };

    $scope.edit = function(method) {
        var index = $scope.methods.indexOf(method);

        cardModal.activate({
            params: {
                method: method,
                close: function(method) {
                    cardModal.deactivate();

                    if (angular.isDefined(method)) {
                        $scope.methods[index] = method;
                    }
                }
            }
        });
    };

    $scope.default = function(method) {
        var order = [];
        var from = $scope.methods.indexOf(method);
        var to = 0;

        _.each($scope.methods, function(method, index) { order.push(index + 1); });
        order.splice(to, 0, order.splice(from, 1)[0]);

        networkActivityTracker.track(Payment.order({
            Order: order
        }).then(function(result) {
            if (result.data && result.data.Code === 1000) {
                $scope.methods.splice(to, 0, $scope.methods.splice(from, 1)[0]);
                notify({message: $translate.instant('PAYMENT_METHOD_UPDATED'), classes: 'notification-success'});
            } else if (result.data && result.data.Error) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            } else {
                notify({message: 'Error during method order request', classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: 'Error during method order request', classes: 'notification-danger'});
        }));
    };

    $scope.delete = function(method) {
        var title = $translate.instant('DELETE_PAYMENT_METHOD');
        var message = $translate.instant('Are you sure you want to delete this payment method?');

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    Payment.deleteMethod(method.ID)
                    .then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            confirmModal.deactivate();
                            $scope.methods.splice($scope.methods.indexOf(method), 1);
                            notify({message: $translate.instant('PAYMENT_METHOD_DELETED'), classes: 'notification-success'});
                        } else if (result.data && result.data.Error) {
                            confirmModal.deactivate();
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        }
                    });
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Download invoice
     * @param {Object} invoice
     */
    $scope.download = function(invoice) {
        networkActivityTracker.track(
            Payment.invoice(invoice.ID)
            .then(function(result) {
                var filename = 'ProtonMail Invoice ' + invoice.ID + '.pdf';
                var blob = new Blob([result.data], { type: 'application/pdf' });

                saveAs(blob, filename);
            })
        );
    };

    /**
     * Open a modal to pay invoice
     * @param {Object} invoice
     */
     $scope.pay = function(invoice) {
         var promises = {
             methods: Payment.methods(),
             check: Payment.check(invoice.ID)
         };

         networkActivityTracker.track($q.all(promises)
         .then(function(result) {
             payModal.activate({
                 params: {
                     invoice: invoice,
                     methods: result.methods.data.PaymentMethods,
                     currency: result.check.data.Currency,
                     amount: result.check.data.Amount,
                     credit: result.check.data.Credit,
                     amountDue: result.check.data.AmountDue,
                     close: function(result) {
                         payModal.deactivate();

                         if (result === true) {
                            // Set invoice state to PAID
                            invoice.State = 1;
                         }
                     }
                 }
             });

         }));
     };
});
