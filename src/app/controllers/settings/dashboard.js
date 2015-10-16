angular.module("proton.controllers.Settings")

.controller('DashboardController', function($rootScope, $scope, $translate, authentication, paymentModal, Payment) {
    $scope.currency = 'CHF'; // TODO we can detect localisation
    $scope.username = authentication.user.Addresses[0].Email.split('@')[0];
    $scope.plan = 'basic'; // TODO need initialization
    $scope.billing = 1; // one month

    var plus = {
        price: 5,
        space: 5,
        domain: 1,
        address: 5,
        user: 0
    };

    var business = {
        price: 10,
        space: 10,
        domain: 1,
        address: 5,
        user: 2
    };

    $scope.plusAdditionals = [
        {checked: false, type: 'space', price: 1, number: 1, title: $translate.instant('STORAGE')},
        {checked: false, type: 'domain', price: 8, number: 1, title: $translate.instant('DOMAIN')},
        {checked: false, type: 'address', price: 2, number: 1, title: $translate.instant('ADDRESS')}
    ];

    $scope.businessAdditionals = [
        {checked: false, type: 'space', price: 1, number: 1, title: $translate.instant('STORAGE')},
        {checked: false, type: 'domain', price: 8, number: 1, title: $translate.instant('DOMAIN')},
        {checked: false, type: 'address', price: 2, number: 1, title: $translate.instant('ADDRESS')},
        {checked: false, type: 'user', price: 2, number: 1, title: $translate.instant('USER')}
    ];

    $scope.total = function(name) {
        var total = 0;
        var additionals = [];

        if(name === 'plus') {
            total += plus.price;
            additionals = $scope.plusAdditionals;
        } else if(name === 'business') {
            total += business.price;
            additionals = $scope.businessAdditionals;
        }

        _.each(additionals, function(element) {
            if(element.checked === true) {
                total += parseInt(element.price) * parseInt(element.number);
            }
        });

        return total * $scope.billing;
    };

    $scope.upgrade = function(name) {
        var additionals = [];
        var pack = {};

        if(name === 'plus') {
            pack = plus;
            additionals = $scope.plusAdditionals;
        } else if(name === 'business') {
            pack = business;
            additionals = $scope.businessAdditionals;
        }

        paymentModal.activate({
            params: {
                currency: $scope.currency,
                billing: $scope.billing,
                pack: pack,
                additionals: additionals,
                submit: function(datas) {
                    console.log(datas);
                    paymentModal.deactivate();
                },
                cancel: function() {
                    paymentModal.deactivate();
                }
            }
        });
    };

    $scope.showPaymentInformation = function(){

    };
});
