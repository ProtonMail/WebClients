angular.module("proton.controllers.Settings")

.controller('InvoicesController', function($rootScope, $scope, $translate, Payment, networkActivityTracker) {
    var YEAR_2015 = 1420070401;
    var YEAR_2016 = 1451606401;

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
        $scope.range = _.findWhere($scope.years, {value: YEAR_2015}); // TODO each year, need to change the initialization
        // Load invoices
        $scope.loadInvoices(YEAR_2015); // TODO each year, need to change the initialization
    };

    /**
     * Load invoices after timestamp specified
     * @param {Integer} timestamp
     */
    $scope.loadInvoices = function(timestamp) {
        var promise = Payment.organization(timestamp);

        promise.then(function(result) {
            if(angular.isDefined(result.data)) {
                console.log(result.data);
                // $scope.invoices;
            }
        });

        networkActivityTracker.track(promise);
    };

    /**
     * Download invoice file
     * @param {Object} payment
     */
    $scope.downloadInvoice = function(payment) {

    };

    // Call initialization
    $scope.initialize();
});
