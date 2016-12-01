angular.module('proton.controllers.Settings')

.controller('DashboardController', (
    $filter,
    $rootScope,
    $scope,
    $stateParams,
    gettextCatalog,
    $q,
    $window,
    eventManager,
    authentication,
    cardModal,
    confirmModal,
    donateModal,
    networkActivityTracker,
    notify,
    Organization,
    Payment,
    paymentModal,
    subscription,
    methods,
    monthly,
    pmcw,
    status,
    supportModal,
    CONSTANTS,
    tools,
    yearly
) => {
    // Initialize variables
    $scope.configuration = {};
    $scope.subscription = {};

    // Options
    $scope.plusSpaceOptions = [
        { label: '5 GB', index: 0, value: 5 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '6 GB', index: 1, value: 6 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '7 GB', index: 2, value: 7 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '8 GB', index: 3, value: 8 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '9 GB', index: 4, value: 9 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '10 GB', index: 5, value: 10 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '11 GB', index: 6, value: 11 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '12 GB', index: 7, value: 12 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '13 GB', index: 8, value: 13 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '14 GB', index: 9, value: 14 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '15 GB', index: 10, value: 15 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '16 GB', index: 11, value: 16 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '17 GB', index: 12, value: 17 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '18 GB', index: 13, value: 18 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '19 GB', index: 14, value: 19 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '20 GB', index: 15, value: 20 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE }
    ];

    $scope.businessSpaceOptions = [
        { label: '10 GB', index: 0, value: 10 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '11 GB', index: 1, value: 11 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '12 GB', index: 2, value: 12 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '13 GB', index: 3, value: 13 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '14 GB', index: 4, value: 14 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '15 GB', index: 5, value: 15 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '16 GB', index: 6, value: 16 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '17 GB', index: 7, value: 17 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '18 GB', index: 8, value: 18 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '19 GB', index: 9, value: 19 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE },
        { label: '20 GB', index: 10, value: 20 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE }
    ];

    $scope.domainOptions = [
        { label: '1', index: 0, value: 1 },
        { label: '2', index: 1, value: 2 },
        { label: '3', index: 2, value: 3 },
        { label: '4', index: 3, value: 4 },
        { label: '5', index: 4, value: 5 },
        { label: '6', index: 5, value: 6 },
        { label: '7', index: 6, value: 7 },
        { label: '8', index: 7, value: 8 },
        { label: '9', index: 8, value: 9 },
        { label: '10', index: 9, value: 10 }
    ];

    $scope.addressOptions = [
        { label: '5', index: 0, value: 5 },
        { label: '10', index: 1, value: 10 },
        { label: '15', index: 2, value: 15 },
        { label: '20', index: 3, value: 20 },
        { label: '25', index: 4, value: 25 },
        { label: '30', index: 5, value: 30 },
        { label: '35', index: 6, value: 35 },
        { label: '40', index: 7, value: 40 },
        { label: '45', index: 8, value: 45 },
        { label: '50', index: 9, value: 50 }
    ];

    $scope.memberOptions = [
        { label: '2', index: 0, value: 2 },
        { label: '3', index: 1, value: 3 },
        { label: '4', index: 2, value: 4 },
        { label: '5', index: 3, value: 5 },
        { label: '6', index: 4, value: 6 },
        { label: '7', index: 5, value: 7 },
        { label: '8', index: 6, value: 8 },
        { label: '9', index: 7, value: 9 },
        { label: '10', index: 8, value: 10 }
    ];

    $scope.selects = {
        plus: {
            space: $scope.plusSpaceOptions[0],
            domain: $scope.domainOptions[0],
            address: $scope.addressOptions[0]
        },
        business: {
            member: $scope.memberOptions[0],
            space: $scope.businessSpaceOptions[0],
            domain: $scope.domainOptions[0],
            address: $scope.addressOptions[0]
        }
    };

    /**
     * Method called at the initialization of this controller
     * @param {Object} subscription
     * @param {Object} monthly
     * @param {Object} yearly
     * @param {Array} methods
     */
    $scope.initialization = (subscription, monthly, yearly, methods) => {
        if (angular.isDefined(subscription)) {
            _.extend($scope.subscription, subscription);
            $scope.configuration.cycle = subscription.Cycle;
            $scope.configuration.currency = subscription.Currency;

            if ($scope.subscription.Name === 'plus') {
                $scope.selects.plus.space = _.findWhere($scope.plusSpaceOptions, { value: $scope.count('MaxSpace') });
                $scope.selects.plus.domain = _.findWhere($scope.domainOptions, { value: $scope.count('MaxDomains') });
                $scope.selects.plus.address = _.findWhere($scope.addressOptions, { value: $scope.count('MaxAddresses') });
            } else if ($scope.subscription.Name === 'business') {
                $scope.selects.business.space = _.findWhere($scope.businessSpaceOptions, { value: $scope.count('MaxSpace') });
                $scope.selects.business.domain = _.findWhere($scope.domainOptions, { value: $scope.count('MaxDomains') });
                $scope.selects.business.address = _.findWhere($scope.addressOptions, { value: $scope.count('MaxAddresses') });
                $scope.selects.business.member = _.findWhere($scope.memberOptions, { value: $scope.count('MaxMembers') });
            } else {
                $scope.selects.plus.space = $scope.plusSpaceOptions[0];
                $scope.selects.plus.domain = $scope.domainOptions[0];
                $scope.selects.plus.address = $scope.addressOptions[0];
                $scope.selects.business.member = $scope.memberOptions[0];
                $scope.selects.business.space = $scope.businessSpaceOptions[0];
                $scope.selects.business.domain = $scope.domainOptions[0];
                $scope.selects.business.address = $scope.addressOptions[0];
            }
        }

        if (angular.isDefined(monthly) && angular.isDefined(yearly)) {
            $scope.plans = monthly.concat(yearly);
            $scope.addons = {
                1: {
                    space: _.findWhere(monthly, { Name: '1gb' }),
                    domain: _.findWhere(monthly, { Name: '1domain' }),
                    address: _.findWhere(monthly, { Name: '5address' }),
                    member: _.findWhere(monthly, { Name: '1member' })
                },
                12: {
                    space: _.findWhere(yearly, { Name: '1gb' }),
                    domain: _.findWhere(yearly, { Name: '1domain' }),
                    address: _.findWhere(yearly, { Name: '5address' }),
                    member: _.findWhere(yearly, { Name: '1member' })
                }
            };

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
    $scope.scrollToPlans = () => {
        $('.settings').animate({
            scrollTop: $('#plans').offset().top
        }, 1000);
    };

    $scope.refresh = () => {
        networkActivityTracker.track(
            $q.all({
                subscription: Payment.subscription(),
                methods: Payment.methods()
            })
            .then((result) => {
                $scope.initialization(result.subscription.data.Subscription, undefined, undefined, result.methods.data.PaymentMethods);
            })
        );
    };

    /**
    * Returns a string for the storage bar
    * @return {String} "12.5"
    */
    $scope.percentage = () => {
        // return Math.round(100 * $scope.organization.UsedSpace / $scope.organization.MaxSpace);
    };

    /**
     * Count the number of type in the current subscription
     * @param {String} type
     */
    $scope.count = (type) => {
        let count = 0;

        if ($scope.subscription.Plans) {
            _.each($scope.subscription.Plans, (plan) => {
                count += plan[type];
            });
        }

        return count;
    };

    /**
     * Calculate price for a specific type in the current subscription
     * @param {String} name
     */
    $scope.price = (name) => {
        let price = 0;

        if ($scope.subscription.Plans) {
            _.each(_.where($scope.subscription.Plans, { Type: 0, Name: name }), (plan) => {
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
    $scope.total = ({ Name }, Cycle) => {
        let total = 0;

        // Base price for this plan
        const plan = _.findWhere($scope.plans, { Name, Cycle });
        total += plan.Amount;

        // Add addons
        if (plan.Name === 'plus' || plan.Name === 'business') {
            total += $scope.selects[plan.Name].space.index * $scope.addons[Cycle].space.Amount;
            total += $scope.selects[plan.Name].domain.index * $scope.addons[Cycle].domain.Amount;
            total += $scope.selects[plan.Name].address.index * $scope.addons[Cycle].address.Amount;

            if (plan.Name === 'business') {
                total += $scope.selects[plan.Name].member.index * $scope.addons[Cycle].member.Amount;
            }
        }

        return total;
    };

    /**
     * Change current currency
     */
    $scope.changeCurrency = (currency) => {
        const deferred = $q.defer();

        if ($scope.configuration.Currency === currency) {
            deferred.resolve();
        } else {
            $q.all({
                monthly: Payment.plans(currency, 1),
                yearly: Payment.plans(currency, 12)
            })
            .then((result) => {
                $scope.configuration.currency = currency;
                $scope.initialization(undefined, result.monthly.data.Plans, result.yearly.data.Plans);
                deferred.resolve();
            });

            networkActivityTracker.track(deferred.promise);
        }

        return deferred.promise;
    };

    /**
     * Change current cycle
     */
    $scope.changeCycle = (cycle) => {
        $scope.configuration.cycle = cycle;
    };

    /**
     * Return the text button for a specific plan
     * @param {Object} plan
     * @return {string} text
     */
    $scope.text = (plan) => {
        let text;

        if (plan.Name === 'free') {
            if ($scope.subscription.Name === plan.Name) {
                text = gettextCatalog.getString('Already subscribed', null, 'Info');
            } else {
                text = gettextCatalog.getString('Downgrade to Free', null, 'Action');
            }
        } else if (plan.Name === 'plus') {
            if ($scope.subscription.Name === plan.Name) {
                text = gettextCatalog.getString('Update Plus', null, 'Action');
            } else if ($scope.subscription.Name === 'free') {
                text = gettextCatalog.getString('Upgrade to Plus', null, 'Action');
            } else if ($scope.subscription.Name === 'business' || $scope.subscription.Name === 'visionary') {
                text = gettextCatalog.getString('Downgrade to Plus', null, 'Action');
            }
        } else if (plan.Name === 'business') {
            if ($scope.subscription.Name === plan.Name) {
                text = gettextCatalog.getString('Update Business', null, 'Action');
            } else if ($scope.subscription.Name === 'free' || $scope.subscription.Name === 'plus') {
                text = gettextCatalog.getString('Upgrade to Business', null, 'Action');
            } else if ($scope.subscription.Name === 'visionary') {
                text = gettextCatalog.getString('Downgrade to Business', null, 'Action');
            }
        } else if (plan.Name === 'visionary') {
            if ($scope.subscription.Name === plan.Name) {
                text = gettextCatalog.getString('Update Visionary', null, 'Action');
            } else {
                text = gettextCatalog.getString('Upgrade to Visionary', null, 'Action');
            }
        }

        return text;
    };

    /**
     * Open donate modal
     */
    $scope.donate = () => {
        if (status.data.Stripe === true) {
            networkActivityTracker.track(
                Payment.methods()
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        donateModal.activate({
                            params: {
                                methods: result.data.PaymentMethods,
                                close() {
                                    // Close donate modal
                                    donateModal.deactivate();
                                }
                            }
                        });
                    }
                })
            );
        } else {
            notify({ message: gettextCatalog.getString('Donations are currently not available, please try again later', null, 'Info') });
        }
    };

    function unsubscribe() {
        return Payment.delete().then((result) => {
            if (result.data && result.data.Code === 1000) {
                return eventManager.call();
            } else if (result.data && result.data.Error) {
                return Promise.reject(result.data.Error);
            }
            return Promise.reject(gettextCatalog.getString('Error processing payment.', null, 'Error'));
        },
        (error) => {
            Promise.reject(error);
        });
    }

    /**
     * Open a modal to confirm to switch to the free plan
     */
    $scope.free = () => {
        const title = gettextCatalog.getString('Confirm downgrade', null, 'Title');
        const message = gettextCatalog.getString('This will downgrade your account to a free account.<br /><br />Active aliases and custom domain addresses will be disabled automatically.<br /><br />ProtonMail is free software that is supported by donations and paid accounts. Please consider <a href="https://protonmail.com/donate" target="_blank">making a donation</a> so we can continue to offer the service for free.', null, 'Info');

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    const promise = unsubscribe().then(() => {
                        $scope.refresh();
                        confirmModal.deactivate();
                        notify({ message: gettextCatalog.getString('You have successfully unsubscribed', null), classes: 'notification-success' });
                    });

                    networkActivityTracker.track(promise);
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
    * Open modal to display information about how contact the support team to setup the enterprise plan
    */
    $scope.enterprise = () => {
        supportModal.activate({
            params: {
                cancel() {
                    supportModal.deactivate();
                }
            }
        });
    };

    /**
    * Open modal to pay the plan configured
    * @param {Object} plan
    */
    $scope.choose = (plan, choice) => {
        if (plan.Name === 'free') {
            $scope.free();
        } else {
            const name = plan.Name;
            const promises = [];
            const planIDs = [plan.ID];
            let i;

            plan.quantity = 1;

            if (plan.Name === 'plus' || plan.Name === 'business') {
                for (i = 0; i < $scope.selects[plan.Name].space.index; i++) {
                    planIDs.push($scope.addons[$scope.configuration.cycle].space.ID);
                }

                for (i = 0; i < $scope.selects[plan.Name].domain.index; i++) {
                    planIDs.push($scope.addons[$scope.configuration.cycle].domain.ID);
                }

                for (i = 0; i < $scope.selects[plan.Name].address.index; i++) {
                    planIDs.push($scope.addons[$scope.configuration.cycle].address.ID);
                }

                if (plan.Name === 'business') {
                    for (i = 0; i < $scope.selects.business.member.index; i++) {
                        planIDs.push($scope.addons[$scope.configuration.cycle].member.ID);
                    }
                }
            }

            // Get payment methods
            promises.push(Payment.methods());
            // Valid plan
            promises.push(Payment.valid({
                Currency: $scope.configuration.currency,
                Cycle: $scope.configuration.cycle,
                CouponCode: '',
                PlanIDs: planIDs
            }));

            networkActivityTracker.track($q.all(promises)
            .then((results) => {
                const methods = results[0];
                const valid = results[1];

                if (methods.data && methods.data.Code === 1000 && valid.data && valid.data.Code === 1000) {
                    // Check amount first
                    if ($scope.total(plan, plan.Cycle) === valid.data.Amount) {
                        paymentModal.activate({
                            params: {
                                subscription: $scope.subscription,
                                create: $scope.organization.PlanName === 'free',
                                planIDs,
                                plans: $scope.plans,
                                valid: valid.data,
                                choice,
                                status: status.data,
                                methods: methods.data.PaymentMethods,
                                change() {
                                    $scope.refresh();
                                    paymentModal.deactivate();
                                },
                                switch(cycle, currency) {
                                    // Set default values
                                    const currentCycle = cycle || $scope.configuration.cycle;
                                    const currentCurrency = currency || $scope.configuration.currency;
                                    // Close payment modal
                                    paymentModal.deactivate();

                                    $scope.changeCycle(currentCycle);
                                    $scope.changeCurrency(currentCurrency)
                                    .then(() => {
                                        $scope.choose(_.findWhere($scope.plans, {
                                            Name: name,
                                            Cycle: currentCycle,
                                            Currency: currentCurrency
                                        }), 'paypal');
                                    });
                                },
                                cancel() {
                                    paymentModal.deactivate();
                                }
                            }
                        });
                    } else {
                        notify({ message: gettextCatalog.getString('Amount mismatch', null, 'Error'), classes: 'notification-danger' });
                    }
                } else if (methods.data && methods.data.Error) {
                    notify({ message: methods.data.Error, classes: 'notification-danger' });
                } else if (valid.data && valid.data.Error) {
                    notify({ message: valid.data.Error, classes: 'notification-danger' });
                }
            }));
        }
    };

    /**
    * Initialize select with the correct quantity object
    */
    $scope.initQuantity = (element) => {
        const option = _.findWhere($scope.options, { value: element.quantity });

        if (angular.isDefined(option)) {
            element.select = option;
        }
    };

    // Call initialization
    $scope.initialization(subscription, monthly.data.Plans, yearly.data.Plans, methods.data.PaymentMethods);
});
