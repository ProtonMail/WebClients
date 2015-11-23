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

    // Prices
    $scope.plusPrice = {1: 5, 12: 47};
    $scope.businessPrice = {1: 10, 12: 97};
    $scope.spacePrice = {1: 1, 12: 9.99};
    $scope.domainPrice = {1: 2, 12: 19.99};
    $scope.addressPrice = {1: 1, 12: 9.99};
    $scope.memberPrice = {1: 5, 12: 49.99 };

    // Options
    $scope.spacePlusOptions = [
        {label: '5.000 MB', value: 5000 * 1000 * 1000, index: 0},
        {label: '10.000 MB', value: 10000 * 1000 * 1000, index: 1},
        {label: '15.000 MB', value: 15000 * 1000 * 1000, index: 2},
        {label: '20.000 MB', value: 20000 * 1000 * 1000, index: 3},
        {label: '25.000 MB', value: 25000 * 1000 * 1000, index: 4},
        {label: '30.000 MB', value: 30000 * 1000 * 1000, index: 5}
    ];

    $scope.spaceBusinessOptions = [
        {label: '10.000 MB', value: 10000 * 1000 * 1000, index: 0},
        {label: '15.000 MB', value: 15000 * 1000 * 1000, index: 1},
        {label: '20.000 MB', value: 20000 * 1000 * 1000, index: 2},
        {label: '25.000 MB', value: 25000 * 1000 * 1000, index: 3},
        {label: '30.000 MB', value: 30000 * 1000 * 1000, index: 4}
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
        $scope.organization = organization.Organization; // TODO need initialization
        $scope.current = payment.Payment; // TODO need initialization
        $scope.currency = 'CHF'; // TODO need initialization
        $scope.billing = 1; // TODO need initialization
        $scope.plan = 'plus'; // TODO need initialization
        $scope.spacePlus = $scope.spacePlusOptions[0]; // TODO need initialization
        $scope.spaceBusiness = $scope.spaceBusinessOptions[0]; // TODO need initialization
        $scope.domainPlus = $scope.domainPlusOptions[0]; // TODO need initialization
        $scope.domainBusiness = $scope.domainBusinessOptions[0]; // TODO need initialization
        $scope.addressPlus = $scope.addressPlusOptions[0]; // TODO need initialization
        $scope.addressBusiness = $scope.addressBusinessOptions[0]; // TODO need initialization
        $scope.memberBusiness = $scope.memberBusinessOptions[0]; // TODO need initialization
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

        if(name === 'plus') {
            total += $scope.plusPrice[$scope.billing];
            total += $scope.spacePlus.index * $scope.spacePrice[$scope.billing];
            total += $scope.domainPlus.index * $scope.domainPrice[$scope.billing];
            total += $scope.addressPlus.index * $scope.addressPrice[$scope.billing];
        } else if(name === 'business') {
            total += $scope.businessPrice[$scope.billing];
            total += $scope.spaceBusiness.index * $scope.spacePrice[$scope.billing];
            total += $scope.domainBusiness.index * $scope.domainPrice[$scope.billing];
            total += $scope.addressBusiness.index * $scope.addressPrice[$scope.billing];
            total += $scope.memberBusiness.index * $scope.memberPrice[$scope.billing];
        }

        return total;
    };

    /**
     * Open modal to pay the plan configured
     * @param {String} name
     */
    $scope.choose = function(name) {
        var current = new Date();
        var domains;
        var addresses;
        var space;
        var members;

        if($scope.billing === 1) {
            domains = $scope.domainPlus.value;
            addresses = $scope.addressPlus.value;
            space = $scope.spacePlus.value;
            members = 1;
        } else if($scope.billing === 12) {
            domains = $scope.domainBusiness.value;
            addresses = $scope.addressBusiness.value;
            space = $scope.spaceBusiness.value;
            members = $scope.memberBusiness.value;
        }

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
                    Plan: name,
                    Use2FA: true,
                    MaxDomains: domains,
                    MaxMembers: members,
                    MaxAddresses: addresses,
                    MaxSpace: space
                }
            }
        };

        // Check configuration choosed
        Payment.plan(configuration).then(function(result) {
            if(angular.isDefined(result.data) && result.data.Code === 1000) {
                paymentModal.activate({
                    params: {
                        configuration: configuration,
                        cancel: function() {
                            paymentModal.deactivate();
                        }
                    }
                });
            } else if(angular.isDefined(result.data) && result.data.Status) {
                // TODO need to complete with Martin
            } else {
                notify({message: $translate.instant('ERROR_TO_CHECK_CONFIGURATION'), classes: 'notification-danger'});
            }
        }, function() {
            notify({message: $translate.instant('ERROR_TO_CHECK_CONFIGURATION'), classes: 'notification-danger'});
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
