angular.module("proton.controllers.Settings")

.controller('DashboardController', function(
    $rootScope,
    $scope,
    $translate,
    authentication,
    cardModal,
    group,
    Payment,
    paymentModal,
    stripeModal
) {
    $scope.group = group.Group;
    $scope.currency = 'CHF'; // TODO we can detect localisation
    $scope.username = authentication.user.Addresses[0].Email.split('@')[0];
    $scope.plan = 'plus'; // TODO need initialization
    $scope.billing = 1; // one month

    $scope.options = [
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

    var plus = {
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

    var business = {
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
        {checked: false, type: 'space', price: { 1: 1, 12: 9.99 }, number: 2, quantity: 1, title: $translate.instant('EXTRA_STORAGE'), long: $translate.instant('EXTRA_STORAGE')},
        {checked: false, type: 'domain', price: { 1: 2, 12: 19.99 }, number: 1, quantity: 1, title: $translate.instant('EXTRA_DOMAIN'), long: $translate.instant('EXTRA_DOMAIN')},
        {checked: false, type: 'address', price: { 1: 1, 12: 9.99 }, number: 5, quantity: 1, title: $translate.instant('EXTRA_ADDRESSES'), long: $translate.instant('EXTRA_ADDRESSES')}
    ];

    $scope.businessAdditionals = [
        {checked: false, type: 'space', price: { 1: 1, 12: 9.99 }, number: 2, quantity: 1, title: $translate.instant('EXTRA_STORAGE'), long: $translate.instant('EXTRA_STORAGE')},
        {checked: false, type: 'domain', price: { 1: 2, 12: 19.99 }, number: 1, quantity: 1, title: $translate.instant('EXTRA_DOMAIN'),long: $translate.instant('EXTRA_DOMAIN')},
        {checked: false, type: 'address', price: { 1: 1, 12: 9.99 }, number: 5, quantity: 1, title: $translate.instant('EXTRA_ADDRESSES'), long: $translate.instant('EXTRA_ADDRESSES')},
        {checked: false, type: 'member', price: { 1: 5, 12: 49.99 }, number: 1, quantity: 1, title: $translate.instant('EXTRA_USER'), long: $translate.instant('EXTRA_USER')}
    ];

    $scope.usedSpace = authentication.user.UsedSpace;
    $scope.maxSpace = authentication.user.MaxSpace;

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
     */
    $scope.total = function(name) {
        var total = 0;
        var additionals = [];

        if(name === 'plus') {
            additionals = $scope.plusAdditionals;
            total += plus.price[$scope.billing];
        } else if(name === 'business') {
            additionals = $scope.businessAdditionals;
            total += business.price[$scope.billing];
        }

        _.each(additionals, function(element) {
            if(element.checked === true) {
                total += element.price[$scope.billing] * element.quantity;
            }
        });

        return total;
    };

    /**
     * Open modal to pay the plan configured
     */
    $scope.choose = function(name) {
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
        cardModal.activate({
            params: {
                mode: 'view',
                cancel: function() {
                    cardModal.deactivate();
                }
            }
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
});
