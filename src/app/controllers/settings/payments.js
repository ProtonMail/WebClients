angular.module('proton.controllers.Settings')

.controller('PaymentsController', (
    $scope,
    $state,
    gettextCatalog,
    $q,
    authentication,
    cardModal,
    customizeInvoiceModal,
    payModal,
    confirmModal,
    invoices,
    methods,
    notify,
    networkActivityTracker,
    organizationInvoices,
    Payment
) => {
    $scope.methods = methods.data.PaymentMethods;
    $scope.subscribed = authentication.user.Subscribed === 1;
    $scope.invoices = invoices.data.Invoices;
    $scope.total = invoices.data.Total;
    $scope.delinquent = authentication.user.Delinquent >= 3;
    $scope.invoiceOwner = 0;
    $scope.role = authentication.user.Role;

    $scope.$on('updateUser', () => {
        $scope.subscribed = authentication.user.Subscribed === 1;
        $scope.delinquent = authentication.user.Delinquent >= 3;

        if (authentication.user.Role !== $scope.role) {
            $state.go('secured.payments');
        }
    });

    $scope.changeInvoices = (owner) => {
        if (owner === 0) {
            $scope.invoices = invoices.data.Invoices;
        } else if (owner === 1) {
            $scope.invoices = organizationInvoices.data.Invoices;
        }
        $scope.invoiceOwner = owner;
    };

    $scope.refresh = function () {
        networkActivityTracker.track(Payment.methods()
        .then((result) => {
            if (result.data && result.data.Code === 1000) {
                $scope.methods = result.data.PaymentMethods;
            }
        }));
    };

    $scope.add = function () {
        cardModal.activate({
            params: {
                close(method) {
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

    $scope.edit = function (method) {
        const index = $scope.methods.indexOf(method);

        cardModal.activate({
            params: {
                method,
                close(method) {
                    cardModal.deactivate();

                    if (angular.isDefined(method)) {
                        $scope.methods[index] = method;
                    }
                }
            }
        });
    };

    $scope.default = function (method) {
        const order = [];
        const from = $scope.methods.indexOf(method);
        const to = 0;

        _.each($scope.methods, (method, index) => { order.push(index + 1); });
        order.splice(to, 0, order.splice(from, 1)[0]);

        networkActivityTracker.track(Payment.order({
            Order: order
        }).then((result) => {
            if (result.data && result.data.Code === 1000) {
                $scope.methods.splice(to, 0, $scope.methods.splice(from, 1)[0]);
                notify({ message: gettextCatalog.getString('Payment method updated', null), classes: 'notification-success' });
            } else if (result.data && result.data.Error) {
                notify({ message: result.data.Error, classes: 'notification-danger' });
            } else {
                notify({ message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger' });
            }
        }, () => {
            notify({ message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger' });
        }));
    };

    $scope.delete = function (method) {
        const title = gettextCatalog.getString('Delete payment method', null, 'Title');
        const message = gettextCatalog.getString('Are you sure you want to delete this payment method?', null, 'Info');

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    networkActivityTracker.track(
                        Payment.deleteMethod(method.ID)
                        .then((result) => {
                            if (result.data && result.data.Code === 1000) {
                                confirmModal.deactivate();
                                $scope.methods.splice($scope.methods.indexOf(method), 1);
                                notify({ message: gettextCatalog.getString('Payment method deleted', null), classes: 'notification-success' });
                            } else if (result.data && result.data.Error) {
                                confirmModal.deactivate();
                                notify({ message: result.data.Error, classes: 'notification-danger' });
                            }
                        })
                    );
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to customize invoice text
     */
    $scope.customize = function () {
        customizeInvoiceModal.activate({
            params: {
                cancel() {
                    customizeInvoiceModal.deactivate();
                }
            }
        });
    };

    /**
     * Download invoice
     * @param {Object} invoice
     */
    $scope.download = function (invoice) {
        networkActivityTracker.track(
            Payment.invoice(invoice.ID)
            .then((result) => {
                const filename = 'ProtonMail Invoice ' + invoice.ID + '.pdf';
                const blob = new Blob([result.data], { type: 'application/pdf' });

                window.saveAs(blob, filename);
            })
        );
    };

    /**
     * Open a modal to pay invoice
     * @param {Object} invoice
     */
    $scope.pay = function (invoice) {
        const promises = {
            methods: Payment.methods(),
            check: Payment.check(invoice.ID),
            status: Payment.status()
        };

        networkActivityTracker.track(
             $q.all(promises)
             .then((result) => {
                 let methods = [];
                 let status;

                 if (result.methods.data && result.methods.data.PaymentMethods) {
                     methods = result.methods.data.PaymentMethods;
                 }

                 if (result.status.data && result.status.data.Code === 1000) {
                     status = result.status.data;
                 }

                 payModal.activate({
                     params: {
                         invoice,
                         methods,
                         status,
                         currency: result.check.data.Currency,
                         amount: result.check.data.Amount,
                         credit: result.check.data.Credit,
                         amountDue: result.check.data.AmountDue,
                         close(result) {
                             payModal.deactivate();

                             if (result === true) {
                                 // Set invoice state to PAID
                                 invoice.State = 1;
                                 // Display a success notification
                                 notify({ message: gettextCatalog.getString('Invoice paid', null, 'Info'), classes: 'notification-success' });
                             }
                         }
                     }
                 });
             })
         );
    };
});
