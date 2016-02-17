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
    Organization,
    organization,
    Payment,
    paymentModal,
    plans,
    pmcw,
    subscription,
    supportModal,
    CONSTANTS,
    tools
) {
    // Initialize variables
    $scope.subscription = {};
    $scope.plans = [];

    // Options
    $scope.spaceOptions = [
        {label: '5 GB', index: 0, value: 5 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '6 GB', index: 1, value: 6 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '7 GB', index: 2, value: 7 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '8 GB', index: 3, value: 8 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '9 GB', index: 4, value: 9 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '10 GB', index: 5, value: 10 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '11 GB', index: 6, value: 11 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '12 GB', index: 7, value: 12 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '13 GB', index: 8, value: 13 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '14 GB', index: 9, value: 14 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '15 GB', index: 10, value: 15 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '16 GB', index: 11, value: 16 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '17 GB', index: 12, value: 17 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '18 GB', index: 13, value: 18 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '19 GB', index: 14, value: 19 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE},
        {label: '20 GB', index: 15, value: 20 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE}
    ];

    $scope.domainOptions = [
        {label: '1', index: 0, value: 1},
        {label: '2', index: 1, value: 2},
        {label: '3', index: 2, value: 3},
        {label: '4', index: 3, value: 4},
        {label: '5', index: 4, value: 5},
        {label: '6', index: 5, value: 6},
        {label: '7', index: 6, value: 7},
        {label: '8', index: 7, value: 8},
        {label: '9', index: 8, value: 9},
        {label: '10', index: 9, value: 10}
    ];

    $scope.addressOptions = [
        {label: '5', index: 0, value: 5},
        {label: '10', index: 1, value: 10},
        {label: '15', index: 2, value: 15},
        {label: '20', index: 3, value: 20},
        {label: '25', index: 4, value: 25},
        {label: '30', index: 5, value: 30},
        {label: '35', index: 6, value: 35},
        {label: '40', index: 7, value: 40},
        {label: '45', index: 8, value: 45},
        {label: '50', index: 9, value: 50}
    ];

    $scope.memberOptions = [
        {label: '2', index: 0, value: 2},
        {label: '3', index: 1, value: 3},
        {label: '4', index: 2, value: 4},
        {label: '5', index: 3, value: 5},
        {label: '6', index: 4, value: 6},
        {label: '7', index: 5, value: 7},
        {label: '8', index: 6, value: 8},
        {label: '9', index: 7, value: 9},
        {label: '10', index: 8, value: 10}
    ];

    /**
    * Method called at the initialization of this controller
    */
    $scope.initialization = function(subscription, plans, organization) {
        if (angular.isDefined(subscription)) {
            _.extend($scope.subscription, subscription);
            $scope.currentCycle = $scope.subscription.Cycle;
            $scope.currentCurrency = $scope.subscription.Currency;
        }

        if (angular.isDefined(plans)) {
            var spaceOption = _.findWhere($scope.spaceOptions, {value: $scope.subscription.MaxSpace}) || $scope.spaceOptions[0];
            var domainOption = _.findWhere($scope.domainOptions, {value: $scope.subscription.MaxDomains}) || $scope.domainOptions[0];
            var addressOption = _.findWhere($scope.addressOptions, {value: $scope.subscription.MaxAddresses}) || $scope.addressOptions[0];
            var memberOption = _.findWhere($scope.memberOptions, {value: $scope.subscription.MaxMembers}) || $scope.memberOptions[0];

            $scope.plans = plans;
            $scope.spaceAddon = _.findWhere(plans, {Name: '1gb'});
            $scope.domainAddon = _.findWhere(plans, {Name: '1domain'});
            $scope.addressAddon = _.findWhere(plans, {Name: '5address'});
            $scope.memberAddon = _.findWhere(plans, {Name: '1member'});

            _.each($scope.plans, function(plan) {
                if (plan.editable === true) {
                    plan.Space = spaceOption;
                    plan.Domain = domainOption;
                    plan.Address = addressOption;
                    plan.Member = memberOption;
                }
            });
        }

        if (angular.isDefined(organization)) {
            $scope.organization = organization;
        }
    };

    $scope.refreshSubscription = function() {
        networkActivityTracker.track(Payment.subscription().then(function(result) {
            if (result.data && result.data.Code === 1000) {
                $scope.initialization(result.data.Subscription);
            }
        }));
    };

    /**
    * Returns a string for the storage bar
    * @return {String} "12.5"
    */
    $scope.percentage = function() {
        // return Math.round(100 * $scope.organization.UsedSpace / $scope.organization.MaxSpace);
    };

    /**
     * Count the number of type in the current subscription
     * @param {String} type
     */
    $scope.count = function(type) {
        var count = 0;

        if ($scope.subscription.Plans) {
            _.each($scope.subscription.Plans, function(plan) {
                count += plan[type];
            });
        }

        return count;
    };

    /**
    * Return the amount of each plan
    * @param {String} name
    */
    $scope.total = function(plan) {
        var total = 0;

        total += plan.Amount;

        if (plan.editable === true) {
            total += plan.Space.index * $scope.spaceAddon.Amount;
            total += plan.Domain.index * $scope.domainAddon.Amount;
            total += plan.Address.index * $scope.addressAddon.Amount;
            total += plan.Member.index * $scope.memberAddon.Amount;
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

    $scope.changeCurrency = function(currency) {
        var deferred = $q.defer();

        Payment.plans(currency, $scope.currentCycle)
        .then(function(result) {
            $scope.initialization({Currency: currency}, result.data.Plans);
            deferred.resolve();
        });

        networkActivityTracker.track(deferred.promise);

        return deferred.promise;
    };

    $scope.changeCycle = function(cycle) {
        var deferred = $q.defer();

        Payment.plans($scope.currentCurrency, cycle)
        .then(function(result) {
            $scope.initialization({Cycle: cycle}, result.data.Plans);
            deferred.resolve();
        });

        networkActivityTracker.track(deferred.promise);

        return deferred.promise;
    };

    /**
     * Open a modal to confirm to switch to the free plan
     */
    $scope.free = function() {
        var title = $translate.instant('CONFIRM_DOWNGRADE');
        var message = 'This will downgrade your account to a free account.<br /><br />ProtonMail is free software that is supported by donations and paid accounts. Please consider <a href="https://protonmail.com/donate" target="_blank">making a donation</a> so we can continue to offer the service for free.';

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    var deleteOrganization = function() {
                        var deferred = $q.defer();

                        Organization.delete()
                        .then(function(result) {
                            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                                deferred.resolve();
                            } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                                deferred.reject(new Error(result.data.Error));
                            } else {
                                deferred.reject(new Error($translate.instant('ERROR_DURING_ORGANIZATION_REQUEST')));
                            }
                        });

                        return deferred.promise;
                    };

                    var unsubscribe = function() {
                        var deferred = $q.defer();

                        Payment.delete()
                        .then(function(result) {
                            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                                deferred.resolve();
                            } else if(angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                                deferred.reject(new Error(result.data.Error));
                            } else {
                                deferred.reject(new Error($translate.instant('ERROR_DURING_PAYMENT_REQUEST')));
                            }
                        });

                        return deferred.promise;
                    };

                    networkActivityTracker.track(
                        unsubscribe()
                        .then(function() {
                            notify({message: $translate.instant('YOU_HAVE_SUCCESSFULLY_UNSUBSCRIBE'), classes: 'notification-success'});
                        })
                        .catch(function(error) {
                            notify({message: error, classes: 'notification-danger'});
                            confirmModal.deactivate();
                        })
                    );
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
    * @param {Object} plan
    */
    $scope.choose = function(plan) {
        if (plan.Name === 'free') {
            $scope.free();
        } else {
            var promises = [];
            var planIDs = [plan.ID];
            var plans = [plan];
            var i;

            plan.quantity = 1;

            if (plan.Name === 'plus' || plan.Name === 'business') {
                $scope.spaceAddon.quantity = plan.Space.index;
                $scope.addressAddon.quantity = plan.Address.index;
                $scope.domainAddon.quantity = plan.Domain.index;
                $scope.memberAddon.quantity = plan.Member.index;

                if (plan.Space.index > 0) {
                    plans.push($scope.spaceAddon);
                }

                if (plan.Address.index > 0) {
                    plans.push($scope.addressAddon);
                }

                if (plan.Domain.index > 0) {
                    plans.push($scope.domainAddon);
                }

                if (plan.Member.index > 0) {
                    plans.push($scope.memberAddon);
                }

                for (i = 0; i < plan.Space.index; i++) {
                    planIDs.push($scope.spaceAddon.ID);
                }

                for (i = 0; i < plan.Address.index; i++) {
                    planIDs.push($scope.addressAddon.ID);
                }

                for (i = 0; i < plan.Domain.index; i++) {
                    planIDs.push($scope.domainAddon.ID);
                }

                for (i = 0; i < plan.Member.index; i++) {
                    planIDs.push($scope.memberAddon.ID);
                }
            }

            // Get payment methods
            promises.push(Payment.methods());
            // Valid plan
            promises.push(Payment.valid({
                Currency : $scope.currentCurrency,
                Cycle : $scope.currentCycle,
                CouponCode : '',
                PlanIDs: planIDs
            }));

            networkActivityTracker.track($q.all(promises)
            .then(function(results) {
                var methods = results[0];
                var valid = results[1];

                if (methods.data && methods.data.Code === 1000 && valid.data && valid.data.Code === 1000) {
                    // Check amount first
                    if ($scope.total(plan) === valid.data.Amount) {
                        if (valid.data.Credit) {
                            plans.push({Title: $translate.instant('CREDIT'), discount: true, Amount: valid.data.Credit, quantity: 1, Currency: $scope.currentCurrency});
                        }

                        if (valid.data.Proration) {
                            plans.push({Title: $translate.instant('PRORATION'), discount: true, Amount: valid.data.Proration, quantity: 1, Currency: $scope.currentCurrency});
                        }

                        if (valid.data.CouponDiscount) {
                            plans.push({Title: $translate.instant('COUPON'), discount: true, Amount: valid.data.CouponDiscount, quantity: 1, Currency: $scope.currentCurrency, Coupon: valid.data.Coupon});
                        }
                    } else {
                        $log.error('Amount is different');
                    }
                }

                paymentModal.activate({
                    params: {
                        plans: plans,
                        planIDs: planIDs,
                        valid: valid.data,
                        methods: methods.data.PaymentMethods,
                        change: function(subscription) {
                            $scope.refreshSubscription();
                            paymentModal.deactivate();
                        },
                        cancel: function() {
                            paymentModal.deactivate();
                        }
                    }
                });
            }));
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
        networkActivityTracker.track(Payment.methods().then(function(result) {
            cardModal.activate({
                params: {
                    methods: result.data.PaymentMethods,
                    cancel: function() {
                        cardModal.deactivate();
                    }
                }
            });
        }, function(error) {
            notify({message: $translate.instant('ERROR_TO_DISPLAY_CARD'), classes: 'notification-danger'});
        }));
    };

    // Call initialization
    $scope.initialization(subscription.data.Subscription, plans.data.Plans, organization.data.Organization);
});
