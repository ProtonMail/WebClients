angular.module("proton.controllers.Settings")

.controller('InvoicesController', function($rootScope, $scope, $translate) {
    var YEAR_2015 = 1420070401;
    var YEAR_2016 = 1451606401;

    $rootScope.pageName = "Invoices";
    $scope.years = [
        {label: $translate.instant('ALL'), value: undefined},
        {label: '2015', value: YEAR_2015},
        {label: '2016', value: YEAR_2016}
    ];
    $scope.invoices = [
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 2 Addons",
            "Price": "10 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 1 Addons",
            "Price": "12 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month)",
            "Price": "13 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 2 Addons",
            "Price": "10 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 1 Addons",
            "Price": "12 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 2 Addons",
            "Price": "10 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 1 Addons",
            "Price": "12 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month)",
            "Price": "13 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 2 Addons",
            "Price": "10 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 1 Addons",
            "Price": "12 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 2 Addons",
            "Price": "10 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 1 Addons",
            "Price": "12 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month)",
            "Price": "13 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 2 Addons",
            "Price": "10 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 1 Addons",
            "Price": "12 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 2 Addons",
            "Price": "10 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 1 Addons",
            "Price": "12 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month)",
            "Price": "13 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 2 Addons",
            "Price": "10 CHF"
        },
        {
            "Date": 1444079277,
            "Event": "Business Plan Subscription (1 month) with 1 Addons",
            "Price": "12 CHF"
        }
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
        Payment.history(timestamp).then(function(result) {
            if(angular.isDefined(result.data)) {
                console.log(result.data);
                // $scope.invoices;
            }
        });
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
