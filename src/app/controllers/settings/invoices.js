angular.module("proton.controllers.Settings")

.controller('InvoicesController', function(
    $rootScope,
    $scope,
    gettextCatalog,
    $state,
    $q,
    networkActivityTracker,
    notify,
    Payment
) {
    var YEAR_2015 = moment({year: 2016, millisecond: 1}).unix();
    var YEAR_2016 = moment({year: 2017, millisecond: 1}).unix();

    $rootScope.pageName = gettextCatalog.getString('Invoices', null, 'Default');
    $scope.organizationInvoices = [];
    $scope.userInvoices = [];
    $scope.years = [
        {label: gettextCatalog.getString('All', null, 'Default'), value: undefined},
        {label: '2016', value: YEAR_2016},
        {label: '2015', value: YEAR_2015}
    ];

    /**
     * Method called at the initialization of the controller
     */
    $scope.initialize = function() {
        // Initial select
        $scope.range = _.findWhere($scope.years, {value: YEAR_2016});
        // Load invoices
        $scope.loadInvoices(YEAR_2016);
    };

    /**
     * Load invoices after timestamp specified
     * @param {Integer} timestamp
     */
    $scope.loadInvoices = function(timestamp) {
        var promises = [];

        promises.push(Payment.organization(timestamp).then(function(result) {
            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                $scope.organizationInvoices = result.data.Payments;
            } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            }
        }));

        promises.push(Payment.user(timestamp).then(function(result) {
            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                $scope.userInvoices = result.data.Payments;
            } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            }
        }));

        networkActivityTracker.track($q.all(promises));
    };

    /**
     * Open a new tab whith the details of invoice
     * @param {Object} invoice
     */
    $scope.display = function(invoice) {
        var url = $state.href('secured.invoice', { time: invoice.Time });

        window.open(url, '_blank');
    };

    // Call initialization
    $scope.initialize();
});
