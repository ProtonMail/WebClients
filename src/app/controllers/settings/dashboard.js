angular.module("proton.controllers.Settings")

.controller('DashboardController', function(
    $rootScope,
    $scope,
    $translate,
    authentication,
    cardModal,
    networkActivityTracker,
    notify,
    organization,
    Organization,
    Payment,
    paymentModal,
    status,
    supportModal
) {
    $scope.username = authentication.user.Addresses[0].Email.split('@')[0];
    $scope.usedSpace = authentication.user.UsedSpace;
    $scope.maxSpace = authentication.user.MaxSpace;
    $scope.organization = null;
    $scope.payment = null;

    // Prices
    $scope.plusPrice = {1: 5, 12: 47};
    $scope.businessPrice = {1: 10, 12: 97};
    $scope.spacePrice = {1: 1, 12: 9.99};
    $scope.domainPrice = {1: 2, 12: 9.99};
    $scope.addressPrice = {1: 2, 12: 9.99};
    $scope.memberPrice = {1: 5, 12: 49.99};

    // Options
    $scope.spacePlusOptions = [
        {label: '5.000 MB', value: 5000 * 1000 * 1000, index: 0},
        {label: '6.000 MB', value: 6000 * 1000 * 1000, index: 1},
        {label: '7.000 MB', value: 7000 * 1000 * 1000, index: 2},
        {label: '8.000 MB', value: 8000 * 1000 * 1000, index: 3},
        {label: '9.000 MB', value: 9000 * 1000 * 1000, index: 4},
        {label: '10.000 MB', value: 10000 * 1000 * 1000, index: 5}
    ];

    $scope.spaceBusinessOptions = [
        {label: '10.000 MB', value: 10000 * 1000 * 1000, index: 0},
        {label: '11.000 MB', value: 11000 * 1000 * 1000, index: 1},
        {label: '12.000 MB', value: 12000 * 1000 * 1000, index: 2},
        {label: '13.000 MB', value: 13000 * 1000 * 1000, index: 3},
        {label: '14.000 MB', value: 14000 * 1000 * 1000, index: 4},
        {label: '15.000 MB', value: 15000 * 1000 * 1000, index: 5},
        {label: '16.000 MB', value: 16000 * 1000 * 1000, index: 6},
        {label: '17.000 MB', value: 17000 * 1000 * 1000, index: 7},
        {label: '18.000 MB', value: 18000 * 1000 * 1000, index: 8},
        {label: '19.000 MB', value: 19000 * 1000 * 1000, index: 9},
        {label: '20.000 MB', value: 20000 * 1000 * 1000, index: 10}
    ];

    $scope.domainPlusOptions = [
        {label: '1', value: 1, index: 0},
        {label: '2', value: 2, index: 1},
        {label: '3', value: 3, index: 2},
        {label: '4', value: 4, index: 3},
        {label: '5', value: 5, index: 4},
        {label: '6', value: 6, index: 5},
        {label: '7', value: 7, index: 6},
        {label: '8', value: 8, index: 7},
        {label: '9', value: 9, index: 8},
        {label: '10', value: 10, index: 9}
    ];

    $scope.domainBusinessOptions = [
        {label: '1', value: 1, index: 0},
        {label: '2', value: 2, index: 1},
        {label: '3', value: 3, index: 2},
        {label: '4', value: 4, index: 3},
        {label: '5', value: 5, index: 4},
        {label: '6', value: 6, index: 5},
        {label: '7', value: 7, index: 6},
        {label: '8', value: 8, index: 7},
        {label: '9', value: 9, index: 8},
        {label: '10', value: 10, index: 9}
    ];

    $scope.addressPlusOptions = [
        {label: '5', value: 5, index: 0},
        {label: '10', value: 10, index: 1},
        {label: '15', value: 15, index: 2},
        {label: '20', value: 20, index: 3},
        {label: '25', value: 25, index: 4},
        {label: '30', value: 30, index: 5}
    ];

    $scope.addressBusinessOptions = [
        {label: '5', value: 5, index: 0},
        {label: '10', value: 10, index: 1},
        {label: '15', value: 15, index: 2},
        {label: '20', value: 20, index: 3},
        {label: '25', value: 25, index: 4},
        {label: '30', value: 30, index: 5}
    ];

    $scope.memberBusinessOptions = [
        {label: '2', value: 2, index: 0},
        {label: '3', value: 3, index: 1},
        {label: '4', value: 4, index: 2},
        {label: '5', value: 5, index: 3},
        {label: '6', value: 6, index: 4},
        {label: '7', value: 7, index: 5},
        {label: '8', value: 8, index: 6},
        {label: '9', value: 9, index: 7},
        {label: '10', value: 10, index: 8}
    ];

    /**
     * Method called at the initialization of this controller
     */
    $scope.initialization = function() {
        if(angular.isDefined(organization.data) && organization.data.Code === 1000) {
            $scope.organization = organization.data.Organization;
        }

        if(angular.isDefined(status.data) && status.data.Code === 1000) {
            var month = 60 * 60 * 24 * 30; // Time for a month in second

            $scope.current = status.data.Cart.Future;
            $scope.future = status.data.Cart.Future;

            if(status.data.Payment) {
                $scope.payment = status.data.Payment;
                $scope.currentCurrency = status.data.Payment.Currency;
                $scope.futureCurrency = status.data.Payment.Currency;

                if(parseInt((status.data.Payment.PeriodEnd - status.data.Payment.PeriodStart) / month) === 1) {
                    $scope.currentBillingCycle = 12;
                    $scope.futureBillingCycle = 12;
                } else {
                    $scope.currentBillingCycle = 1;
                    $scope.futureBillingCycle = 1;
                }
            } else {
                $scope.currentCurrency = 'CHF';
                $scope.futureCurrency = 'CHF';
                $scope.currentBillingCycle = 1;
                $scope.futureBillingCycle = 1;
            }

            var spacePlus = _.findWhere($scope.spacePlusOptions, {value: $scope.current.MaxSpace});
            var spaceBusiness = _.findWhere($scope.spaceBusinessOptions, {value: $scope.current.MaxSpace});
            var domainPlus = _.findWhere($scope.domainPlusOptions, {value: $scope.current.MaxDomains});
            var domainBusiness = _.findWhere($scope.domainBusinessOptions, {value: $scope.current.MaxDomains});
            var addressPlus = _.findWhere($scope.addressPlusOptions, {value: $scope.current.MaxAddresses});
            var addressBusiness = _.findWhere($scope.addressBusinessOptions, {value: $scope.current.MaxAddresses});
            var memberBusiness = _.findWhere($scope.memberBusinessOptions, {value: $scope.current.MaxMembers});

            if(angular.isDefined(spacePlus)) {
                $scope.spacePlus = spacePlus;
            } else {
                $scope.spacePlus = $scope.spacePlusOptions[0];
            }

            if(angular.isDefined(spaceBusiness)) {
                $scope.spaceBusiness = spaceBusiness;
            } else {
                $scope.spaceBusiness = $scope.spaceBusinessOptions[0];
            }

            if(angular.isDefined(domainPlus)) {
                $scope.domainPlus = domainPlus;
            } else {
                $scope.domainPlus = $scope.domainPlusOptions[0];
            }

            if(angular.isDefined(domainBusiness)) {
                $scope.domainBusiness = domainBusiness;
            } else {
                $scope.domainBusiness = $scope.domainBusinessOptions[0];
            }

            if(angular.isDefined(addressPlus)) {
                $scope.addressPlus = addressPlus;
            } else {
                $scope.addressPlus = $scope.addressPlusOptions[0];
            }

            if(angular.isDefined(addressBusiness)) {
                $scope.addressBusiness = addressBusiness;
            } else {
                $scope.addressBusiness = $scope.addressBusinessOptions[0];
            }

            if(angular.isDefined(memberBusiness)) {
                $scope.memberBusiness = memberBusiness;
            } else {
                $scope.memberBusiness = $scope.memberBusinessOptions[0];
            }
        }
    };

    /**
     * Returns a string for the storage bar
     * @return {String} "12.5"
     */
    $scope.percentage = function() {
        return Math.round(100 * $scope.organization.UsedSpace / $scope.organization.MaxSpace);
    };

    /**
     * Return the amount of each plan
     * @param {String} name
     */
    $scope.total = function(name) {
        var total = 0;

        if(name === 'plus') {
            total += $scope.plusPrice[$scope.futureBillingCycle];
            total += $scope.spacePlus.index * $scope.spacePrice[$scope.futureBillingCycle];
            total += $scope.domainPlus.index * $scope.domainPrice[$scope.futureBillingCycle];
            total += $scope.addressPlus.index * $scope.addressPrice[$scope.futureBillingCycle];
        } else if(name === 'business') {
            total += $scope.businessPrice[$scope.futureBillingCycle];
            total += $scope.spaceBusiness.index * $scope.spacePrice[$scope.futureBillingCycle];
            total += $scope.domainBusiness.index * $scope.domainPrice[$scope.futureBillingCycle];
            total += $scope.addressBusiness.index * $scope.addressPrice[$scope.futureBillingCycle];
            total += $scope.memberBusiness.index * $scope.memberPrice[$scope.futureBillingCycle];
        }

        return total;
    };

    /**
     * Prepare amount for the request
     * @param {String} name
     */
    $scope.amount = function(name) {
        return $scope.total(name) * 100;
    };

    /**
     * Open modal to pay the plan configured
     * @param {String} name
     */
    $scope.choose = function(name) {
        var now = moment().unix();
        var future;
        var configuration = {
            Subscription: {
                Amount: $scope.amount(name),
                Currency: $scope.futureCurrency,
                BillingCycle: $scope.futureBillingCycle,
                Time: now,
                PeriodStart: now,
                ExternalProvider: "Stripe"
            },
            Cart: {
                Current: $scope.current
            }
        };

        switch (name) {
            case 'free':
                future = null;
                break;
            case 'plus':
                future = {
                    Plan: name,
                    Use2FA: true,
                    MaxDomains: $scope.domainPlus.value,
                    MaxMembers: 1,
                    MaxAddresses: $scope.addressPlus.value,
                    MaxSpace: $scope.spacePlus.value
                };
                break;
            case 'business':
                future = {
                    Plan: name,
                    Use2FA: true,
                    MaxDomains: $scope.domainBusiness.value,
                    MaxMembers: $scope.memberBusiness.value,
                    MaxAddresses: $scope.addressBusiness.value,
                    MaxSpace: $scope.spaceBusiness.value
                };
                break;
            case 'enterprise':
                future = {}; // TODO need Martin to complete
                break;
            default:
                break;
        }

        configuration.Cart.Future = future;

        if(['free', 'plus', 'business'].indexOf(name) !== -1) {
            // Check configuration choosed
            networkActivityTracker.track(Payment.plan(configuration).then(function(result) {
                if(angular.isDefined(result.data) && result.data.Code === 1000) {
                    if(['plus', 'business'].indexOf(name) !== -1) {
                        paymentModal.activate({
                            params: {
                                configuration: configuration,
                                cancel: function() {
                                    paymentModal.deactivate();
                                }
                            }
                        });
                    } else if(name === 'free') {
                        var title = $translate.instant('');
                        var message = "Are you sure?";

                        confirmModal.activate({
                            params: {
                                title: title,
                                message: message,
                                confirm: function() {
                                    Organization.create(configuration).then(function(result) {
                                        if(angular.isDefined(result.data) && result.data.Code === 1000) {
                                            confirmModal.deactivate();
                                            // TODO notify
                                        } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                                            // TODO notify
                                        } else {
                                            // TODO notify
                                        }
                                    }, function(error) {
                                        // TODO notify
                                    });
                                },
                                cancel: function() {
                                    confirmModal.deactivate();
                                }
                            }
                        });
                    }
                } else if(angular.isDefined(result.data) && result.data.Status) {
                    // TODO need to complete with Martin
                    // notify({message: $translate.instant('ERROR_TO_CHECK_CONFIGURATION'), classes: 'notification-danger'});
                } else {
                    notify({message: $translate.instant('ERROR_TO_CHECK_CONFIGURATION'), classes: 'notification-danger'});
                }
            }, function() {
                notify({message: $translate.instant('ERROR_TO_CHECK_CONFIGURATION'), classes: 'notification-danger'});
            }));
        } else if(name === 'enterprise') {
            // TODO Open modal to contact support
            supportModal.activate({
                params: {
                    cancel: function() {
                        supportModal.deactivate();
                    }
                }
            });
        }
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
    $scope.card = function() {
        networkActivityTracker.track(Payment.sources().then(function(result) {
            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                // Array of credit card information
                var cards = result.data.Sources;

                cardModal.activate({
                    params: {
                        card: _.first(cards),
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
        }));
    };

    // Call initialization
    $scope.initialization();
});
