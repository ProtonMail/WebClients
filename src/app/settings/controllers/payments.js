import _ from 'lodash';
import { UNPAID_STATE } from '../../constants';

/* @ngInject */
function PaymentsController(
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
    downloadFile,
    notification,
    networkActivityTracker,
    organizationInvoices,
    Payment,
    paymentModel
) {
    $scope.methods = methods;
    $scope.subscribed = authentication.user.Subscribed;
    $scope.invoices = invoices.data.Invoices;
    $scope.total = invoices.data.Total;
    $scope.delinquent = authentication.user.Delinquent >= UNPAID_STATE.DELINQUENT;
    $scope.invoiceOwner = 0;
    $scope.role = authentication.user.Role;

    $scope.$on('updateUser', () => {
        $scope.subscribed = authentication.user.Subscribed;
        $scope.delinquent = authentication.user.Delinquent >= UNPAID_STATE.DELINQUENT;

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

    $scope.add = () => {
        cardModal.activate({
            params: {
                close({ methods, method } = {}) {
                    cardModal.deactivate();
                    method && ($scope.methods = methods);
                }
            }
        });
    };

    $scope.edit = (method) => {
        cardModal.activate({
            params: {
                method,
                close({ methods, method } = {}) {
                    cardModal.deactivate();
                    method && ($scope.methods = methods);
                }
            }
        });
    };

    $scope.default = function(method) {
        const methods = $scope.methods.slice();
        const index = _.findIndex(methods, { ID: method.ID });

        methods.splice(index, 1);
        methods.unshift(method);

        const promise = Payment.order({ PaymentMethodIDs: _.map(methods, 'ID') })
            .then(({ data = {} } = {}) => {
                $scope.methods = methods;
                notification.success(gettextCatalog.getString('Payment method updated', null, 'Payment'));
                return data;
            })
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'));
            });

        networkActivityTracker.track(promise);
    };

    $scope.delete = function(method) {
        const title = gettextCatalog.getString('Delete payment method', null, 'Title');
        const message = gettextCatalog.getString('Are you sure you want to delete this payment method?', null, 'Info');

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    const promise = Payment.deleteMethod(method.ID)
                        .then(() => paymentModel.getMethods(true))
                        .then(confirmModal.deactivate)
                        .then(() => {
                            $scope.methods.splice($scope.methods.indexOf(method), 1);
                            notification.success(gettextCatalog.getString('Payment method deleted', null, 'Payment'));
                        })
                        .catch((error) => {
                            const { data = {} } = error;
                            confirmModal.deactivate();
                            error.message && notification.error(error.message);
                            data.Error && notification.error(data.Error);
                        });
                    networkActivityTracker.track(promise);
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
    $scope.customize = function() {
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
    $scope.download = (invoice) => {
        networkActivityTracker.track(
            Payment.invoice(invoice.ID).then((result) => {
                const filename = 'ProtonMail Invoice ' + invoice.ID + '.pdf';
                const blob = new Blob([result.data], { type: 'application/pdf' });

                downloadFile(blob, filename);
            })
        );
    };

    /**
     * Open a modal to pay invoice
     * @param {Object} invoice
     */
    $scope.pay = function(invoice) {
        const promises = {
            methods: Payment.methods(),
            check: Payment.check(invoice.ID),
            status: Payment.status()
        };

        networkActivityTracker.track(
            $q.all(promises).then((result) => {
                const methods = result.methods.data.PaymentMethods;
                const status = result.status.data;

                payModal.activate({
                    params: {
                        invoice,
                        methods,
                        status,
                        currency: result.check.data.Currency,
                        amount: result.check.data.Amount,
                        credit: result.check.data.Credit,
                        amountDue: result.check.data.AmountDue,
                        checkInvoice: result.check.data,
                        close(result) {
                            payModal.deactivate();

                            if (result === true) {
                                // Set invoice state to PAID
                                invoice.State = 1;
                                // Display a success notification
                                notification.success(gettextCatalog.getString('Invoice paid', null, 'Info'));
                            }
                        }
                    }
                });
            })
        );
    };
}
export default PaymentsController;
