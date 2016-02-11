angular.module("proton.controllers.Settings")

.controller('DashboardController', function(
    $filter,
    $rootScope,
    $scope,
    $translate,
    $q,
    $window,
    eventManager,
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
    supportModal,
    CONSTANTS,
    tools
) {
    // Load stripe JS
    tools.loadStripe();

    // Default values for organization and subscription
    $scope.organization = null;

    // Initialize default currency
    $scope.currentCurrency = 'USD';
    $scope.futureCurrency = 'USD';

    // Initialize default billing cycle
    $scope.currentBillingCycle = 1;
    $scope.futureBillingCycle = 1;

    // Initialize default values for the current object
    $scope.current = null;

    // Prices
    $scope.plusPrice = {1: 5, 12: 49.99};
    $scope.businessPrice = {1: 10, 12: 99.99};
    $scope.visionaryPrice = {1: 30, 12: 299.99};
    $scope.spacePrice = {1: 1, 12: 9.99};
    $scope.domainPrice = {1: 2, 12: 19.99};
    $scope.addressPrice = {1: 1, 12: 9.99};
    $scope.memberPrice = {1: 5, 12: 49.99};

    // Options
    $scope.spacePlusOptions = [
        {label: '5 GB', value: 5 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 0},
        {label: '6 GB', value: 6 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 1},
        {label: '7 GB', value: 7 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 2},
        {label: '8 GB', value: 8 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 3},
        {label: '9 GB', value: 9 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 4},
        {label: '10 GB', value: 10 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 5},
        {label: '11 GB', value: 11 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 6},
        {label: '12 GB', value: 12 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 7},
        {label: '13 GB', value: 13 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 8},
        {label: '14 GB', value: 14 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 9},
        {label: '15 GB', value: 15 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 10},
        {label: '16 GB', value: 16 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 11},
        {label: '17 GB', value: 17 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 12},
        {label: '18 GB', value: 18 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 13},
        {label: '19 GB', value: 19 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 14},
        {label: '20 GB', value: 20 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 15}
    ];

    $scope.spaceBusinessOptions = [
        {label: '10 GB', value: 10 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 0},
        {label: '11 GB', value: 11 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 1},
        {label: '12 GB', value: 12 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 2},
        {label: '13 GB', value: 13 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 3},
        {label: '14 GB', value: 14 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 4},
        {label: '15 GB', value: 15 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 5},
        {label: '16 GB', value: 16 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 6},
        {label: '17 GB', value: 17 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 7},
        {label: '18 GB', value: 18 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 8},
        {label: '19 GB', value: 19 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 9},
        {label: '20 GB', value: 20 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE, index: 10}
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
        {label: '30', value: 30, index: 5},
        {label: '35', value: 35, index: 6},
        {label: '40', value: 40, index: 7},
        {label: '45', value: 45, index: 8},
        {label: '50', value: 50, index: 9}
    ];

    $scope.addressBusinessOptions = [
        {label: '5', value: 5, index: 0},
        {label: '10', value: 10, index: 1},
        {label: '15', value: 15, index: 2},
        {label: '20', value: 20, index: 3},
        {label: '25', value: 25, index: 4},
        {label: '30', value: 30, index: 5},
        {label: '35', value: 35, index: 6},
        {label: '40', value: 40, index: 7},
        {label: '45', value: 45, index: 8},
        {label: '50', value: 50, index: 9}
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

    // Set default values for selects
    $scope.spacePlus = $scope.spacePlusOptions[0];
    $scope.spaceBusiness = $scope.spaceBusinessOptions[0];
    $scope.domainPlus = $scope.domainPlusOptions[0];
    $scope.domainBusiness = $scope.domainBusinessOptions[0];
    $scope.addressPlus = $scope.addressPlusOptions[0];
    $scope.addressBusiness = $scope.addressBusinessOptions[0];
    $scope.memberBusiness = $scope.memberBusinessOptions[0];

    /**
    * Method called at the initialization of this controller
    */
    $scope.initialization = function() {
        if(angular.isDefined(organization.data) && organization.data.Code === 1000) {
            $scope.organization = organization.data.Organization;
            $scope.current = _.pick(organization.data.Organization, 'Use2FA', 'MaxDomains', 'MaxMembers', 'MaxAddresses', 'MaxSpace');
            $scope.future = _.pick(organization.data.Organization, 'Use2FA', 'MaxDomains', 'MaxMembers', 'MaxAddresses', 'MaxSpace');
            $scope.spacePlus = _.findWhere($scope.spacePlusOptions, {value: $scope.organization.MaxSpace});
            $scope.domainPlus = _.findWhere($scope.domainPlusOptions, {value: $scope.organization.MaxDomains});
            $scope.domainBusiness = _.findWhere($scope.domainBusinessOptions, {value: $scope.organization.MaxDomains});
            $scope.addressPlus = _.findWhere($scope.addressPlusOptions, {value: $scope.organization.MaxAddresses});
            $scope.addressBusiness = _.findWhere($scope.addressBusinessOptions, {value: $scope.organization.MaxAddresses});

            if($scope.organization.MaxMembers > 1) {
                $scope.spaceBusiness = _.findWhere($scope.spaceBusinessOptions, {value: $scope.organization.MaxSpace});
                $scope.memberBusiness = _.findWhere($scope.memberBusinessOptions, {value: $scope.organization.MaxMembers});
            }
        }

        if(angular.isDefined(subscriptions.data) && subscriptions.data.Code === 1000) {
            $scope.subscription = subscriptions.data.Subscription;
            $scope.currentCurrency = subscriptions.data.Subscription.Currency;
            $scope.futureCurrency = subscriptions.data.Subscription.Currency;
            $scope.currentBillingCycle = subscriptions.data.Subscription.BillingCycle;
            $scope.futureBillingCycle = subscriptions.data.Subscription.BillingCycle;

            if($scope.current) {
                $scope.current.Plan = subscriptions.data.Subscription.Plan;
                $scope.future.Plan = subscriptions.data.Subscription.Plan;
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
        } else if (name === 'visionary') {
            total += $scope.visionaryPrice[$scope.futureBillingCycle];
        }

        return total;
    };

    /**
    * Prepare amount for the request
    * @param {String} name
    * @return {Integer}
    */
    $scope.amount = function(name) {
        return parseFloat($scope.total(name) * 100);
    };

    /**
     * Open a modal to confirm to switch to the free plan
     */
    $scope.free = function() {
        var title = $translate.instant('FREE_PLAN');
        var message = $translate.instant('CONFIRM_FREE_PLAN?');

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    Organization.delete({ExternalSubscriptionID: $scope.subscription.ExternalSubscriptionID}).then(function(result) {
                        if(angular.isDefined(result.data) && result.data.Code === 1000) {
                            $scope.organization = null;
                            _.extend($scope.subscription, result.data.Subscription);
                            eventManager.call();
                            confirmModal.deactivate();
                            notify({message: $translate.instant('YOU_HAVE_SUCCESSFULLY_UNSUBSCRIBE'), classes: 'notification-success'});
                        } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: $translate.instant('ERROR_DURING_ORGANIZATION_REQUEST'), classes: 'notification-danger'});
                        }
                    }, function(result) {
                        if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: $translate.instant('ERROR_DURING_ORGANIZATION_REQUEST'), classes: 'notification-danger'});
                        }
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
    * @param {String} name ('plus' or 'business')
    */
    $scope.choose = function(name) {
        var now = moment().unix();
        var current = $scope.current;
        var promises = [];
        var future;
        var configuration;

        switch (name) {
            case 'plus':
                future = {
                    Plan: name,
                    Use2FA: 0,
                    MaxDomains: $scope.domainPlus.value,
                    MaxMembers: 1,
                    MaxAddresses: $scope.addressPlus.value,
                    MaxSpace: $scope.spacePlus.value
                };
                break;
            case 'business':
                future = {
                    Plan: name,
                    Use2FA: 0,
                    MaxDomains: $scope.domainBusiness.value,
                    MaxMembers: $scope.memberBusiness.value,
                    MaxAddresses: $scope.addressBusiness.value,
                    MaxSpace: $scope.spaceBusiness.value
                };
                break;
            case 'visionary':
                future = {
                    Plan: name,
                    Use2FA: 0,
                    MaxDomains: 10,
                    MaxMembers: 1,
                    MaxAddresses: 50,
                    MaxSpace: 21474836480
                };
                break;
            default:
                break;
        }

        configuration = {
            Subscription: {
                Amount: $scope.amount(name),
                Currency: $scope.futureCurrency,
                BillingCycle: $scope.futureBillingCycle,
                Time: now,
                PeriodStart: now,
                ExternalProvider: 'Stripe'
            },
            Cart: {
                Previous: current,
                Next: future
            }
        };

        promises.push(Payment.plan(configuration)); // Check the configuration choosed
        promises.push(Payment.sources()); // Return the credit card
        promises.push(Payment.keys()); // Return public key to encrypt metadata

        networkActivityTracker.track($q.all(promises).then(function(results) {
            var plan = results[0];
            var card = results[1];
            var key = results[2];
            var organizationName = '';

            if($scope.organization) {
                organizationName = $scope.organization.DisplayName;
            } else if (name === 'plus' || name === 'visionary') {
                organizationName = $translate.instant('MY_ORGANIZATION');
            }

            if (angular.isDefined(plan.data) && plan.data.Code === 1000 && angular.isDefined(card.data) && key.data.Code === 1000 && angular.isDefined(key.data) && key.data.Code === 1000) {
                configuration.Organization = {
                    DisplayName: organizationName
                };
                // Open payment modal
                paymentModal.activate({
                    params: {
                        create: $scope.organization === null, // new organization?
                        card: card.data.Source,
                        key: key.data.Key,
                        configuration: configuration,
                        monthly: function() {
                            paymentModal.deactivate();
                            $scope.futureBillingCycle = 1;
                            $scope.choose(name);
                        },
                        yearly: function() {
                            paymentModal.deactivate();
                            $scope.futureBillingCycle = 12;
                            $scope.choose(name);
                        },
                        change: function(organization) {
                            Payment.subscriptions().then(function(subscriptions) {
                                if(angular.isDefined(subscriptions.data) && subscriptions.data.Code === 1000) {
                                    $scope.subscription = subscriptions.data.Subscription;
                                    $scope.currentCurrency = subscriptions.data.Subscription.Currency;
                                    $scope.futureCurrency = subscriptions.data.Subscription.Currency;
                                    $scope.currentBillingCycle = subscriptions.data.Subscription.BillingCycle;
                                    $scope.futureBillingCycle = subscriptions.data.Subscription.BillingCycle;
                                    $scope.organization = organization;
                                    eventManager.call();
                                }
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
        $q.all({source: Payment.sources(), key: Payment.keys()}).then(function(result) {
            cardModal.activate({
                params: {
                    card: result.source.data.Source,
                    key: result.key.data.Key,
                    cancel: function() {
                        cardModal.deactivate();
                    }
                }
            });
        }, function(error) {
            notify({message: $translate.instant('ERROR_TO_DISPLAY_CARD'), classes: 'notification-danger'});
        });
    };

    // Call initialization
    $scope.initialization();
});
