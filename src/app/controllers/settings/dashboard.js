angular.module("proton.controllers.Settings")

.controller('DashboardController', function($rootScope, $scope, $translate, authentication, paymentModal, Payment) {
    $scope.currency = 'CHF'; // TODO we can detect localisation
    $scope.username = authentication.user.Addresses[0].Email.split('@')[0];
    $scope.plan = 'basic'; // TODO need initialization
    $scope.billing = 1; // one month

    var plus = {
        title: $translate.instant('PLUS'),
        long: $translate.instant('PLUS_PLAN'),
        number: 1,
        price: 5,
        space: 5,
        domain: 1,
        address: 5,
        member: 0
    };

    var business = {
        title: $translate.instant('BUSINESS'),
        long: $translate.instant('BUSINESS_PLAN'),
        number: 1,
        price: 10,
        space: 10,
        domain: 1,
        address: 5,
        member: 2
    };

    $scope.plusAdditionals = [
        {checked: false, type: 'space', price: 1, number: 1, title: $translate.instant('2 GB'), long: $translate.instant('ADDITIONAL_STORAGE')},
        {checked: false, type: 'domain', price: 8, number: 1, title: $translate.instant('DOMAIN'), long: $translate.instant('ADDITIONAL_DOMAINS')},
        {checked: false, type: 'address', price: 2, number: 1, title: $translate.instant('5 ADDRESSES'), long: $translate.instant('ADDITIONAL_ADDRESSES')}
    ];

    $scope.businessAdditionals = [
        {checked: false, type: 'space', price: 1, number: 1, title: $translate.instant('STORAGE'), long: $translate.instant('ADDITIONAL_STORAGE')},
        {checked: false, type: 'domain', price: 8, number: 1, title: $translate.instant('DOMAIN'),long: $translate.instant('ADDITIONAL_DOMAINS')},
        {checked: false, type: 'address', price: 2, number: 1, title: $translate.instant('ADDRESS'), long: $translate.instant('ADDITIONAL_ADDRESSES')},
        {checked: false, type: 'member', price: 2, number: 1, title: $translate.instant('MEMBER'), long: $translate.instant('ADDITIONAL_MEMBERS')}
    ];

    $scope.total = function(name) {
        var total = 0;
        var additionals = [];

        if(name === 'plus') {
            total += plus.price * $scope.billing;
            additionals = $scope.plusAdditionals;
        } else if(name === 'business') {
            total += business.price * $scope.billing;
            additionals = $scope.businessAdditionals;
        }

        if($scope.billing === 12) {
            total *= 0.75;
        }

        _.each(additionals, function(element) {
            if(element.checked === true) {
                total += parseInt(element.price) * parseInt(element.number) * $scope.billing;
            }
        });

        return total;
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
