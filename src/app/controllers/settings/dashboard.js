angular.module("proton.controllers.Settings")

.controller('DashboardController', function(
    $rootScope,
    $scope,
    $translate,
    authentication,
    cardModal,
    notify,
    organization,
    Payment,
    paymentModal,
    payment
) {
    $scope.username = authentication.user.Addresses[0].Email.split('@')[0];
    $scope.usedSpace = authentication.user.UsedSpace;
    $scope.maxSpace = authentication.user.MaxSpace;

    $scope.options = [
        {label: '0', value: 0},
        {label: '1', value: 1},
        {label: '2', value: 2},
        {label: '3', value: 3},
        {label: '4', value: 4},
        {label: '5', value: 5},
        {label: '6', value: 6},
        {label: '7', value: 7},
        {label: '8', value: 8},
        {label: '9', value: 9},
        {label: '10', value: 10}
    ];

    $scope.plus = {
        title: $translate.instant('PLUS'),
        long: $translate.instant('PLUS_PLAN'),
        number: 1,
        price: {
            1: 5,
            12: 49.99
        },
        space: 5,
        domain: 1,
        address: 5,
        member: 0,
        quantity: 1
    };

    $scope.business = {
        title: $translate.instant('BUSINESS'),
        long: $translate.instant('BUSINESS_PLAN'),
        number: 1,
        price: {
            1: 10,
            12: 99.99
        },
        space: 10,
        domain: 1,
        address: 5,
        member: 2,
        quantity: 1
    };

    $scope.plusAdditionals = [
        {type: 'space', price: { 1: 1, 12: 9.99 }, number: 2, quantity: 0, title: $translate.instant('EXTRA_STORAGE'), long: $translate.instant('EXTRA_STORAGE')},
        {type: 'domain', price: { 1: 2, 12: 19.99 }, number: 1, quantity: 0, title: $translate.instant('EXTRA_DOMAIN'), long: $translate.instant('EXTRA_DOMAIN')},
        {type: 'address', price: { 1: 1, 12: 9.99 }, number: 5, quantity: 0, title: $translate.instant('EXTRA_ADDRESSES'), long: $translate.instant('EXTRA_ADDRESSES')}
    ];

    $scope.businessAdditionals = [
        {type: 'space', price: { 1: 1, 12: 9.99 }, number: 2, quantity: 0, title: $translate.instant('EXTRA_STORAGE'), long: $translate.instant('EXTRA_STORAGE')},
        {type: 'domain', price: { 1: 2, 12: 19.99 }, number: 1, quantity: 0, title: $translate.instant('EXTRA_DOMAIN'),long: $translate.instant('EXTRA_DOMAIN')},
        {type: 'address', price: { 1: 1, 12: 9.99 }, number: 5, quantity: 0, title: $translate.instant('EXTRA_ADDRESSES'), long: $translate.instant('EXTRA_ADDRESSES')},
        {type: 'member', price: { 1: 5, 12: 49.99 }, number: 1, quantity: 0, title: $translate.instant('EXTRA_USER'), long: $translate.instant('EXTRA_USER')}
    ];

    /**
     * Method called at the initialization of this controller
     */
    $scope.initialization = function() {
        $scope.organization = organization.Organization; // TODO need initialization
        $scope.current = payment.Payment; // TODO need initialization
        $scope.currency = 'CHF'; // TODO need initialization
        $scope.plan = 'plus'; // TODO need initialization
        $scope.billing = 1; // TODO need initialization
    };

    /**
     * Returns a string for the storage bar
     * @return {String} "12.5"
     */
    $scope.storagePercentage = function() {
        if (authentication.user.UsedSpace && authentication.user.MaxSpace) {
            return Math.round(100 * authentication.user.UsedSpace / authentication.user.MaxSpace);
        } else {
            // TODO: error, undefined variables
            return '';
        }
    };

    /**
     * Return the amount of each plan
     * @param {String} name
     */
    $scope.total = function(name) {
        var total = 0;
        var additionals = [];

        if(name === 'plus') {
            additionals = $scope.plusAdditionals;
            total += $scope.plus.price[$scope.billing];
        } else if(name === 'business') {
            additionals = $scope.businessAdditionals;
            total += $scope.business.price[$scope.billing];
        }

        _.each(additionals, function(element) {
            if(element.quantity > 0) {
                total += element.price[$scope.billing] * element.quantity;
            }
        });

        return total;
    };

    $scope.count = function(type, plan) {
        var quantity = 0;
        var pack;
        var additionals;

        if(plan === 'plus') {
            pack = $scope.plus;
            additionals = $scope.plusAdditionals;
        } else if(plan === 'business') {
            pack = $scope.business;
            additionals = $scope.plusAdditionals;
        }

        if(angular.isDefined(pack)) {
            quantity += pack[type];
        }

        if(angular.isDefined(additionals)) {
            var element = _.filter(additionals, function(additional) {
                return additional.type === type && additional.quantity > 0;
            });

            if(angular.isDefined(element)) {
                quantity += element.quantity;
            }
        }

        return quantity;
    };

    /**
     * Open modal to pay the plan configured
     * @param {String} name
     */
    $scope.choose = function(name) {
        var current = new Date();
        var configuration = {
            Subscription: {
                Amount: $scope.total(name),
                Currency: $scope.currency,
                BillingCycle: $scope.billing,
                Time: current.getTime(),
                PeriodStart: current.getTime(),
                ExternalProvider: "Stripe"
            },
            Cart: {
                Current: $scope.current,
                Future: {
                    Use2FA: true,
                    MaxDomains: $scope.count('domain', name),
                    MaxMembers: $scope.count('member', name),
                    MaxAddresses: $scope.count('address', name),
                    MaxSpace: $scope.count('space', name)
                }
            }
        };

        // Check configuration choosed
        Payment.plan(configuration).then(function(result) {
            if(result.data && result.data.Code === 1000) {
                var additionals = [];
                var pack = {};

                if(name === 'plus') {
                    pack = $scope.plus;
                    additionals = $scope.plusAdditionals;
                } else if(name === 'business') {
                    pack = $scope.business;
                    additionals = $scope.businessAdditionals;
                }

                paymentModal.activate({
                    params: {
                        configuration: configuration,
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
            } else {
                // TODO notify
            }
        });
    };

    /**
     * Initialize select with the correct quantity object
     */
    $scope.initQuantity = function(element) {
        var option = _.findWhere($scope.options, {value: element.quantity});

        if(angular.isDefined(option)) {
            element.select = option;
        }
    };

    /**
     * Method called when the quantity selector change
     */
    $scope.changeQuantity = function(element) {
        element.quantity = element.select.value;
    };

    /**
     * Open modal with payment information
     */
    $scope.viewCard = function() {
        Payment.sources().then(function(result) {
            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                // Array of credit card information
                var cards = result.data.Source;

                cardModal.activate({
                    params: {
                        card: _.first(cards), // We take only the first
                        mode: 'view',
                        cancel: function() {
                            cardModal.deactivate();
                        }
                    }
                });
            } else {
                notify({message: $translate.instant('ERROR_TO_DISPLAY_CARD'), classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: $translate.instant('ERROR_TO_DISPLAY_CARD'), classes: 'notification-danger'});
        });
    };

    /**
     * Open modal to edit payment information
     */
    $scope.editCard = function() {
        cardModal.activate({
            params: {
                mode: 'edit',
                cancel: function() {
                    cardModal.deactivate();
                }
            }
        });
    };

    // Call initialization
    $scope.initialization();
});
