angular.module("proton.controllers.Settings")

.controller('InvoicesController', function($rootScope, $scope, paymentModal) {
    $rootScope.pageName = "Invoices";
    $scope.payments = [
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

    $scope.openPaymentModal = function() {
        paymentModal.activate({
            params: {
                submit: function(datas) {

                    paymentModal.deactivate();
                },
                cancel: function() {
                    paymentModal.deactivate();
                }
            }
        });
    };
});
