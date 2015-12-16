angular.module("proton.controllers.Settings")

.controller('InvoicesController', function(
    $rootScope,
    $scope,
    $translate,
    $state,
    networkActivityTracker,
    notify,
    Payment
) {
    var YEAR_2015 = moment({year: 2016, millisecond: 1}).unix();
    var YEAR_2016 = moment({year: 2017, millisecond: 1}).unix();

    $rootScope.pageName = $translate.instant('INVOICES');
    $scope.years = [
        {label: $translate.instant('ALL'), value: undefined},
        {label: '2015', value: YEAR_2015},
        {label: '2016', value: YEAR_2016}
    ];

    /**
     * Method called at the initialization of the controller
     */
    $scope.initialize = function() {
        // Initial select
        $scope.range = _.findWhere($scope.years, {value: YEAR_2015});
        // Load invoices
        $scope.loadInvoices(YEAR_2015);
    };

    /**
     * Load invoices after timestamp specified
     * @param {Integer} timestamp
     */
    $scope.loadInvoices = function(timestamp) {
        var promise = Payment.organization(timestamp);
        var month = 60 * 60 * 24 * 30; // Time for a month in second

        promise.then(function(result) {
            if(angular.isDefined(result.data)) {
                if(angular.isDefined(result.data) && result.data.Code === 1000) {
                    $scope.invoices = result.data.Payments;

                    _.each($scope.invoices, function(invoice) {
                        if(parseInt((invoice.Payment.PeriodEnd - invoice.Payment.PeriodStart) / month) === 1) {
                            invoice.Payment.BillingCycle = 12;
                        } else {
                            invoice.Payment.BillingCycle = 1;
                        }
                    });
                } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                    notify({message: result.data.Error, classes: 'notification-danger'});
                }
            }
        });

        networkActivityTracker.track(promise);
    };

    /**
     * Open a new tab whith the details of invoice
     * @param {Object} invoice
     */
    $scope.display = function(invoice) {
        var url = $state.href('secured.invoice', { time: invoice.Payment.Time });

        window.open(url, '_blank');
    };

    // Call initialization
    $scope.initialize();
});
