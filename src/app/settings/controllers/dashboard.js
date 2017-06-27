angular.module('proton.settings')
.controller('DashboardController', (
    CONSTANTS,
    $scope,
    $stateParams,
    gettextCatalog,
    $q,
    eventManager,
    authentication,
    confirmModal,
    donateModal,
    networkActivityTracker,
    notify,
    Payment,
    organizationModel,
    paymentModal,
    methods,
    pmcw,
    status,
    subscriptionModel,
    supportModal,
    tools,
    dashboardOptions,
    dashboardPlans,
    dashboardModel
) => {
    // Initialize variables
    $scope.configuration = {};
    const { PLANS_TYPE } = CONSTANTS;
    $scope.subscription = subscriptionModel.get();
    $scope.organization = organizationModel.get();

    const { monthly, yearly } = dashboardPlans;
    // Options
    $scope.plusSpaceOptions = dashboardOptions.get('space');
    $scope.businessSpaceOptions = dashboardOptions.get('businessSpace');
    $scope.domainOptions = dashboardOptions.get('domain');
    $scope.addressOptions = dashboardOptions.get('address');
    $scope.memberOptions = dashboardOptions.get('member');

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

    function updateSubscription() {
        const subscription = subscriptionModel.get();
        $scope.hasPaidMail = subscriptionModel.hasPaid('mail');
        $scope.hasPaidVPN = subscriptionModel.hasPaid('vpn');

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

    function updatePlans(monthly, yearly) {
        $scope.plans = monthly.list.concat(yearly.list);
        $scope.addons = {
            1: {
                space: monthly.addons['1gb'],
                domain: monthly.addons['1domain'],
                address: monthly.addons['5address'],
                member: monthly.addons['1member']
            },
            12: {
                space: yearly.addons['1gb'],
                domain: yearly.addons['1domain'],
                address: yearly.addons['5address'],
                member: yearly.addons['1member']
            }
        };
    }

    function updateMethods(methods) {
        $scope.methods = methods;
    }

    /**
     * Method called at the initialization of this controller
     * @param {Object} subscription
     * @param {Object} monthly
     * @param {Object} yearly
     * @param {Array} methods
     */
    function initialization(monthly, yearly, methods) {
        updateSubscription();
        updatePlans(monthly, yearly);
        updateMethods(methods);

        const vpn = _.where(subscriptionModel.get().Plans, { Type: PLANS_TYPE.PLAN })
            .filter(({ Name }) => /^vpn/.test(Name))[0];

        // Force binding AFTER linking with the default value
        $scope.$applyAsync(() => {
            $scope.configuration.vpnOption = vpn;
        });

        if ($stateParams.scroll === true) {
            $scope.scrollToPlans();
        }
    }

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
                subscription: subscriptionModel.fetch(),
                methods: Payment.methods()
            })
            .then((result) => {
                updateSubscription();
                updateMethods(result.methods.data.PaymentMethods);
            })
        );
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
    $scope.total = ({ Name }, Cycle, includeVPN = true) => {
        let total = 0;

        const vpnPlan = $scope.configuration.vpnOption || {};
        // Base price for this plan
        const plan = _.findWhere($scope.plans, { Name, Cycle });
        // We compute the price for the VPN based on the arg Cycle not the selected cycle
        const { vpn } = dashboardModel.get(Cycle === 12 ? 'yearly' : 'monthly');
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

        if (vpnPlan.ID && plan.Name !== 'visionary' && includeVPN) {
            return total + vpn[vpnPlan.Name].Amount;
        }

        // Custom case for the view if we are free and with a VPN
        if (plan.Name === 'free' && vpnPlan.ID) {
            return vpn[vpnPlan.Name].Amount;
        }

        return total;
    };

    const updateVPN = (cycle, { yearly, monthly } = dashboardModel.get()) => {
        const { Name } = $scope.configuration.vpnOption || {};
        if (cycle === 12) {
            return ($scope.configuration.vpnOption = yearly.vpn[Name]);
        }
        return ($scope.configuration.vpnOption = monthly.vpn[Name]);
    };
    /**
     * Change current currency
     */
    $scope.changeCurrency = (currency) => {

        if ($scope.configuration.currency === currency) {
            return Promise.resolve();
        }

        return dashboardModel.loadPlans(currency)
            .then(({ monthly, yearly }) => {
                $scope.$applyAsync(() => {
                    $scope.configuration.currency = currency;
                    updatePlans(monthly, yearly);
                    updateVPN($scope.configuration.cycle, { monthly, yearly });
                });
            });
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

        if (plan.Name === 'free') {

            if (($scope.configuration.vpnOption || {}).ID) {
                return gettextCatalog.getString('Update', null, 'Action');
            }

            if ($scope.subscription.Name === plan.Name) {
                return gettextCatalog.getString('Already subscribed', null, 'Info');
            }

            return gettextCatalog.getString('Downgrade to Free', null, 'Action');
        }

        if (plan.Name === 'plus') {
            if ($scope.subscription.Name === plan.Name) {
                return gettextCatalog.getString('Update Plus', null, 'Action');
            }

            if ($scope.subscription.Name === 'free' || /^vpn/.test($scope.subscription.Name)) {
                return gettextCatalog.getString('Upgrade to Plus', null, 'Action');
            }

            if ($scope.subscription.Name === 'business' || $scope.subscription.Name === 'visionary') {
                return gettextCatalog.getString('Downgrade to Plus', null, 'Action');
            }
        }

        if (plan.Name === 'business') {
            if ($scope.subscription.Name === plan.Name) {
                return gettextCatalog.getString('Update Business', null, 'Action');
            }
            if ($scope.subscription.Name === 'free' || $scope.subscription.Name === 'plus') {
                return gettextCatalog.getString('Upgrade to Business', null, 'Action');
            }
            if ($scope.subscription.Name === 'visionary') {
                return gettextCatalog.getString('Downgrade to Business', null, 'Action');
            }
        }

        if (plan.Name === 'visionary') {
            if ($scope.subscription.Name === plan.Name) {
                return gettextCatalog.getString('Update Visionary', null, 'Action');
            }
            return gettextCatalog.getString('Upgrade to Visionary', null, 'Action');
        }

        return '';
    };

    /**
     * Open donate modal
     */
    $scope.donate = () => {
        if (status.data.Stripe || status.data.Paymentwall) {
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
        return Payment.delete()
            .then(({ data = {} }) => {

                if (data.Code !== 1000) {
                    throw new Error(data.Error || gettextCatalog.getString('Error processing payment.', null, 'Error'));
                }

                return eventManager.call();
            });
    }

    /**
     * Open a modal to confirm to switch to the free plan
     */
    $scope.free = () => {
        const title = gettextCatalog.getString('Confirm downgrade', null, 'Title');
        const message = gettextCatalog.getString('This will downgrade your account to a free account. ProtonMail is free software that is supported by donations and paid accounts. Please consider making a donation so we can continue to offer the service for free.<br /><br />Note: Additional addresses, custom domains, and members must be removed/disabled before performing this action.', null, 'Info');

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

    const buildPlanIDs = (plan) => {

        const planIDs = [plan.ID];

        if (plan.Name !== 'visionary') {
            planIDs.push(($scope.configuration.vpnOption || {}).ID);
        }

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

        return planIDs.filter(Boolean);
    };

    $scope.addVPN = ({ Name, Cycle }) => {
        const key = (Cycle === 12) ? 'yearly' : 'monthly';
        const { vpn } = dashboardModel.get(key);

        if (Name === 'free') {
            return ($scope.configuration.vpnOption = vpn.vpnbasic);
        }

        return ($scope.configuration.vpnOption = vpn.vpnplus);
    };

    /**
    * Open modal to pay the plan configured
    * @param {Object} plan
    */
    $scope.choose = (plan, choice) => {

        if (plan.Name === 'free' && !($scope.configuration.vpnOption || {}).ID) {
            return $scope.free();
        }
        const name = plan.Name;
        const promises = [];
        const PlanIDs = buildPlanIDs(plan);

        // Get payment methods
        promises.push(Payment.methods());
        // Valid plan
        promises.push(Payment.valid({
            Currency: $scope.configuration.currency,
            Cycle: $scope.configuration.cycle,
            CouponCode: subscriptionModel.coupon(),
            PlanIDs
        }));

        const promise = Promise.all(promises)
            .then(([ { data: methods = {} }, { data: valid = {} } ]) => {

                if (methods.Error || valid.Error) {
                    throw new Error(methods.Error || valid.Error);
                }

                if (methods.Code === 1000 && valid.Code === 1000) {

                    if ($scope.total(plan, plan.Cycle) !== valid.Amount) {
                        throw new Error(gettextCatalog.getString('Amount mismatch', null, 'Error'));
                    }

                    const organization = organizationModel.get();
                    paymentModal.activate({
                        params: {
                            subscription: $scope.subscription,
                            create: organization.PlanName === 'free',
                            planIDs: PlanIDs,
                            plans: dashboardModel.query($scope.configuration.currency, $scope.configuration.cycle),
                            valid,
                            choice,
                            status: status.data,
                            methods: methods.PaymentMethods,
                            change() {
                                $scope.refresh();
                                paymentModal.deactivate();
                                if (plan.Name === 'visionary') {
                                    $scope.configuration.vpnOption = undefined;
                                }
                            },
                            switch(cycle, currency) {
                                // Set default values
                                const currentCycle = cycle || $scope.configuration.cycle;
                                const currentCurrency = currency || $scope.configuration.currency;
                                // Close payment modal
                                paymentModal.deactivate();

                                if (plan.Name === 'visionary') {
                                    $scope.configuration.vpnOption = undefined;
                                }

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

                }

            });

        networkActivityTracker.track(promise);
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
    initialization(monthly, yearly, methods.data.PaymentMethods);
});
