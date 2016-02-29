angular.module("proton.controllers.Settings")

.controller('DashboardController', function(
    $filter,
    $rootScope,
    $scope,
    $stateParams,
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
    methods,
    monthly,
    pmcw,
    subscription,
    supportModal,
    CONSTANTS,
    tools,
    yearly
) {
    // Initialize variables
    $scope.configuration = {};
    $scope.subscription = {};

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

    $scope.selects = {
        plus: {
            space: $scope.spaceOptions[0],
            domain: $scope.domainOptions[0],
            address: $scope.addressOptions[0]
        }
    };

    /**
     * Method called at the initialization of this controller
     * @param {Object} subscription
     * @param {Object} monthly
     * @param {Object} yearly
     * @param {Object} organization
     */
    $scope.initialization = function(subscription, monthly, yearly, organization, methods) {
        if (angular.isDefined(subscription)) {
            _.extend($scope.subscription, subscription);
            $scope.configuration.cycle = subscription.Cycle;
            $scope.configuration.currency = subscription.Currency;

            if ($scope.subscription.Name === 'plus' || $scope.subscription.Name === 'business') {
                $scope.selects.plus.space = _.findWhere($scope.spaceOptions, {value: $scope.count('MaxSpace')});
                $scope.selects.plus.domain = _.findWhere($scope.domainOptions, {value: $scope.count('MaxDomains')});
                $scope.selects.plus.address = _.findWhere($scope.addressOptions, {value: $scope.count('MaxAddresses')});
            } else {
                $scope.selects.plus.space = $scope.spaceOptions[0];
                $scope.selects.plus.domain = $scope.domainOptions[0];
                $scope.selects.plus.address = $scope.addressOptions[0];
            }
        }

        if (angular.isDefined(monthly) && angular.isDefined(yearly)) {
            $scope.plans = monthly.concat(yearly);
            $scope.addons = {
                1: {
                    space: _.findWhere(monthly, {Name: '1gb'}),
                    domain: _.findWhere(monthly, {Name: '1domain'}),
                    address: _.findWhere(monthly, {Name: '5address'})
                },
                12: {
                    space: _.findWhere(yearly, {Name: '1gb'}),
                    domain: _.findWhere(yearly, {Name: '1domain'}),
                    address: _.findWhere(yearly, {Name: '5address'})
                }
            };

        }

        if (angular.isDefined(organization)) {
            $scope.organization = organization;
        }

        if (angular.isDefined(methods)) {
            $scope.methods = methods;
        }

        if ($stateParams.scroll === true) {
            $scope.scrollToPlans();
        }
    };

    /**
     * Scroll to the plans section
     */
    $scope.scrollToPlans = function() {
        $('.settings').animate({
            scrollTop: $("#plans").offset().top
        }, 1000);
    };

    $scope.refresh = function() {
        networkActivityTracker.track(
            $q.all({
                subscription: Payment.subscription(),
                organization: Organization.get(),
                methods: Payment.methods(),
                event: eventManager.call()
            })
            .then(function(result) {
                $scope.initialization(result.subscription.data.Subscription, undefined, undefined, result.organization.data.Organization, result.methods.data.PaymentMethods);
            })
        );
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
     * Calculate price for a specific type in the current subscription
     * @param {String} name
     */
    $scope.price = function(name) {
        var price = 0;

        if ($scope.subscription.Plans) {
            _.each(_.where($scope.subscription.Plans, {Type: 0, Name: name}) , function(plan) {
                price += plan.Amount;
            });
        }

        return price;
    };

    /**
    * Return the amount of each plan
    * @param {String} name
    * @param {Integer} cycle
    */
    $scope.total = function(plan, cycle) {
        var total = 0;

        // Base price for this plan
        plan = _.findWhere($scope.plans, {Name: plan.Name, Cycle: cycle});
        total += plan.Amount;

        // Add addons
        if (plan.editable === true) {
            total += $scope.selects.plus.space.index * $scope.addons[cycle].space.Amount;
            total += $scope.selects.plus.domain.index * $scope.addons[cycle].domain.Amount;
            total += $scope.selects.plus.address.index * $scope.addons[cycle].address.Amount;
        }

        return total;
    };

    /**
     * Change current currency
     */
    $scope.changeCurrency = function(currency) {
        var promise = $q.all({
            monthly: Payment.plans(currency, 1),
            yearly: Payment.plans(currency, 12)
        })
        .then(function(result) {
            $scope.configuration.currency = currency;
            $scope.initialization(undefined, result.monthly.data.Plans, result.yearly.data.Plans);
        });

        networkActivityTracker.track(promise);

        return promise;
    };

    /**
     * Change current cycle
     */
    $scope.changeCycle = function(cycle) {
        $scope.configuration.cycle = cycle;
    };

    /**
     * Return the text button for a specific plan
     * @param {Object} plan
     * @return {string} text
     */
    $scope.text = function(plan) {
        var text;

        if (plan.Name === 'free') {
            if ($scope.subscription.Name === plan.Name) {
                text = 'Already Subscribed';
            } else {
                text = 'Downgrade To Free';
            }
        } else if (plan.Name === 'plus') {
            if ($scope.subscription.Name === plan.Name) {
                text = 'Update Plus';
            } else if ($scope.subscription.Name === 'free') {
                text = 'Upgrade To Plus';
            } else if ($scope.subscription.Name === 'visionary') {
                text = 'Downgrade To Plus';
            }
        } else if (plan.Name === 'visionary') {
            if ($scope.subscription.Name === plan.Name) {
                text = 'Update Visionary';
            } else {
                text = 'Upgrade To Visionary';
            }
        }

         return text;
    };

    /**
     * Open a modal to confirm to switch to the free plan
     */
    $scope.free = function() {
        var title = $translate.instant('CONFIRM_DOWNGRADE');
        var message = 'This will downgrade your account to a free account.<br /><br />Please disable all additional addresses prior to downgrading your account. You can manage that inside the addresses tab.<br /><br />ProtonMail is free software that is supported by donations and paid accounts. Please consider <a href="https://protonmail.com/donate" target="_blank">making a donation</a> so we can continue to offer the service for free.';

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

                    var finish = function() {
                        $scope.refresh();
                        confirmModal.deactivate();
                        notify({message: $translate.instant('YOU_HAVE_SUCCESSFULLY_UNSUBSCRIBED'), classes: 'notification-success'});
                    };

                    networkActivityTracker.track(
                        deleteOrganization()
                        .then(unsubscribe)
                        .then(finish)
                        .catch(function(error) {
                            notify({message: error, classes: 'notification-danger'});
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
            var name = plan.Name;
            var promises = [];
            var planIDs = [plan.ID];
            var i;

            plan.quantity = 1;

            if (plan.Name === 'plus' || plan.Name === 'business') {
                for (i = 0; i < $scope.selects.plus.space.index; i++) {
                    planIDs.push($scope.addons[$scope.configuration.cycle].space.ID);
                }

                for (i = 0; i < $scope.selects.plus.domain.index; i++) {
                    planIDs.push($scope.addons[$scope.configuration.cycle].domain.ID);
                }

                for (i = 0; i < $scope.selects.plus.address.index; i++) {
                    planIDs.push($scope.addons[$scope.configuration.cycle].address.ID);
                }
            }

            // Get payment methods
            promises.push(Payment.methods());
            // Valid plan
            promises.push(Payment.valid({
                Currency : $scope.configuration.currency,
                Cycle : $scope.configuration.cycle,
                CouponCode : '',
                PlanIDs: planIDs
            }));

            networkActivityTracker.track($q.all(promises)
            .then(function(results) {
                var methods = results[0];
                var valid = results[1];

                if (methods.data && methods.data.Code === 1000 && valid.data && valid.data.Code === 1000) {
                    // Check amount first
                    if ($scope.total(plan, plan.Cycle) === valid.data.Amount) {
                        paymentModal.activate({
                            params: {
                                create: $scope.organization === null,
                                planIDs: planIDs,
                                plans: $scope.plans,
                                valid: valid.data,
                                methods: methods.data.PaymentMethods,
                                change: function(subscription) {
                                    $scope.refresh();
                                    paymentModal.deactivate();
                                },
                                yearly: function() {
                                    paymentModal.deactivate();
                                    $scope.changeCycle(12);
                                    $scope.choose(_.findWhere($scope.plans, {Name: name, Cycle: 12}));
                                },
                                cancel: function() {
                                    paymentModal.deactivate();
                                }
                            }
                        });
                    } else {
                        notify({message: $translate.instant('AMOUNT_IS_DIFFERENT'), classes: 'notification-danger'});
                    }
                } else if (methods.data && methods.data.Error) {
                    notify({message: methods.data.Error, classes: 'notification-danger'});
                } else if (valid.data && valid.data.Error) {
                    notify({message: valid.data.Error, classes: 'notification-danger'});
                }
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

    // Call initialization
    $scope.initialization(subscription.data.Subscription, monthly.data.Plans, yearly.data.Plans, organization.data.Organization, methods.data.PaymentMethods);
});
