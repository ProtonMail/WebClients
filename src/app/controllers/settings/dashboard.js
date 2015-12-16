angular.module("proton.controllers.Settings")

.controller('DashboardController', function(
    $filter,
    $rootScope,
    $scope,
    $translate,
    $q,
    authentication,
    cardModal,
    confirmModal,
    networkActivityTracker,
    notify,
    organization,
    Organization,
    Payment,
    paymentModal,
    pmcw,
    subscriptions,
    supportModal
) {
    // Default values for organization and subscription
    $scope.organization = null;
    $scope.subscription = null;

    // Initialize default currency
    $scope.currentCurrency = 'CHF';
    $scope.futureCurrency = 'CHF';

    // Initialize default billing cycle
    $scope.currentBillingCycle = 1;
    $scope.futureBillingCycle = 1;

    // Initialize default values for the current object
    $scope.current = {
        Plan: 'free',
        Use2FA: false,
        MaxDomains: 1,
        MaxMembers: 1,
        MaxAddresses: 1,
        MaxSpace: 1000 * 1000 * 1000
    };

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
        var spacePlus, spaceBusiness, domainPlus, domainBusiness, addressPlus, addressBusiness, memberBusiness;

        if(angular.isDefined(subscriptions.data) && subscriptions.data.Code === 1000) {
            $scope.subscription = subscriptions.data.Subscriptions[0].Subscription;
            $scope.currentCurrency = subscriptions.data.Subscriptions[0].Subscription.Currency;
            $scope.futureCurrency = subscriptions.data.Subscriptions[0].Subscription.Currency;
            $scope.currentBillingCycle = subscriptions.data.Subscriptions[0].Subscription.BillingCycle;
            $scope.futureBillingCycle = subscriptions.data.Subscriptions[0].Subscription.BillingCycle;
            $scope.current = subscriptions.data.Subscriptions[0].Cart.Future;
            $scope.future = subscriptions.data.Subscriptions[0].Cart.Future;
        }

        if(angular.isDefined(organization.data) && organization.data.Code === 1000) {
            var month = 60 * 60 * 24 * 30; // Time for a month in second

            $scope.organization = organization.data.Organization;
            spacePlus = _.findWhere($scope.spacePlusOptions, {value: $scope.organization.MaxSpace});
            spaceBusiness = _.findWhere($scope.spaceBusinessOptions, {value: $scope.organization.MaxSpace});
            domainPlus = _.findWhere($scope.domainPlusOptions, {value: $scope.organization.MaxDomains});
            domainBusiness = _.findWhere($scope.domainBusinessOptions, {value: $scope.organization.MaxDomains});
            addressPlus = _.findWhere($scope.addressPlusOptions, {value: $scope.organization.MaxAddresses});
            addressBusiness = _.findWhere($scope.addressBusinessOptions, {value: $scope.organization.MaxAddresses});
            memberBusiness = _.findWhere($scope.memberBusinessOptions, {value: $scope.organization.MaxMembers});
        }

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
     * Open a modal to confirm to switch to the free plan
     */
    $scope.free = function() {
        var title = $translate.instant('FREE_PLAN');
        var message = $translate.instant("Are you sure to come back to the Free Plan?");

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    Payment.delete({ExternalSubscriptionID: $scope.subscription.ExternalSubscriptionID}).then(function(result) {
                        if(angular.isDefined(result.data) && result.data.Code === 1000) {
                            confirmModal.deactivate();
                            notify({message: 'You are currently unsubscribed, your features will be disabled on ' + $filter('date')($scope.subscription.PeriodEnd * 1000, 'date', 'medium'), classes: 'notification-success'});
                            $scope.organization = null;
                            $scope.subscription = null;
                            $scope.current = {
                                Plan: 'free',
                                Use2FA: false,
                                MaxDomains: 1,
                                MaxMembers: 1,
                                MaxAddresses: 1,
                                MaxSpace: 1000 * 1000 * 1000
                            };
                        } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: $translate.instant('ERROR'), classes: 'notification-danger'});
                        }
                    }, function(error) {
                        notify({message: $translate.instant('ERROR'), classes: 'notification-danger'});
                    });
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to display information about how contact the support team to setup the enterprise plan
     */
    $scope.enterprise = function() {
        supportModal.activate({
            params: {
                cancel: function() {
                    supportModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to pay the plan configured
     * @param {String} name
     */
    $scope.choose = function(name) {
        var now = moment().unix();
        var future;
        var promises = [];
        var current = $scope.current;
        var configuration = {
            Organization: {
                DisplayName: ($scope.organization) ? $scope.organization.DisplayName : authentication.user.DisplayName,
                EncToken: pmcw.encode_base64(pmcw.arrayToBinaryString(pmcw.generateKeyAES()))
            },
            Subscription: {
                Amount: $scope.amount(name),
                Currency: $scope.futureCurrency,
                BillingCycle: $scope.futureBillingCycle,
                Time: now,
                PeriodStart: now,
                ExternalProvider: 'Stripe'
            },
            Cart: {}
        };

        if($scope.current.Plan === 'free') {
            current = null;
        }

        switch (name) {
            case 'plus':
                future = {
                    Plan: name,
                    Use2FA: false,
                    MaxDomains: $scope.domainPlus.value,
                    MaxMembers: 1,
                    MaxAddresses: $scope.addressPlus.value,
                    MaxSpace: $scope.spacePlus.value
                };
                break;
            case 'business':
                future = {
                    Plan: name,
                    Use2FA: false,
                    MaxDomains: $scope.domainBusiness.value,
                    MaxMembers: $scope.memberBusiness.value,
                    MaxAddresses: $scope.addressBusiness.value,
                    MaxSpace: $scope.spaceBusiness.value
                };
                break;
            default:
                break;
        }

        configuration.Cart.Current = current;
        configuration.Cart.Future = future;

        promises.push(Payment.plan(configuration));
        promises.push(Payment.sources());

        // Check configuration choosed
        networkActivityTracker.track($q.all(promises).then(function(results) {
            var plan = results[0];
            var card = results[1];

            if(angular.isDefined(plan.data) && plan.data.Code === 1000) {
                // Open payment modal
                paymentModal.activate({
                    params: {
                        create: organization === true,
                        card: card,
                        configuration: configuration,
                        change: function(organization) {
                            Payment.subscriptions().then(function(subscriptions) {
                                if(angular.isDefined(subscriptions.data) && subscriptions.data.Code === 1000) {
                                    $scope.subscription = subscriptions.data.Subscriptions[0].Subscription;
                                    $scope.currentCurrency = subscriptions.data.Subscriptions[0].Subscription.Currency;
                                    $scope.futureCurrency = subscriptions.data.Subscriptions[0].Subscription.Currency;
                                    $scope.currentBillingCycle = subscriptions.data.Subscriptions[0].Subscription.BillingCycle;
                                    $scope.futureBillingCycle = subscriptions.data.Subscriptions[0].Subscription.BillingCycle;
                                    $scope.current = subscriptions.data.Subscriptions[0].Cart.Future;
                                    $scope.future = subscriptions.data.Subscriptions[0].Cart.Future;
                                }

                                _.extend($scope.organization, organization);
                            });
                        },
                        cancel: function() {
                            paymentModal.deactivate();
                        }
                    }
                });
            } else if(angular.isDefined(plan.data) && plan.data.Error) {
                notify({message: plan.data.Error, classes: 'notification-danger'});
            } else {
                notify({message: $translate.instant('ERROR_TO_CHECK_CONFIGURATION'), classes: 'notification-danger'});
            }
        }, function() {
            notify({message: $translate.instant('ERROR_TO_CHECK_CONFIGURATION'), classes: 'notification-danger'});
        }));
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
