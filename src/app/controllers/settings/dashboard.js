angular.module("proton.controllers.Settings")

.controller('DashboardController', function($rootScope, $scope, authentication) {
    $scope.currency = 'CHF';
    $scope.username = authentication.user.Addresses[0].Email.split('@')[0];
    $scope.plan = 'basic';
    $scope.billing = 'monthly';
    $scope.plus = {
        storage: {
            checked: false,
            price: 1,
            number: 1
        },
        domain: {
            checked: false,
            price: 8,
            number: 1
        },
        address: {
            checked: false,
            price: 2,
            number: 1
        }
    };
    $scope.business = {
        storage: {
            checked: false,
            price: 1,
            number: 1
        },
        domain: {
            checked: false,
            price: 8,
            number: 1
        },
        address: {
            checked: false,
            price: 2,
            number: 1
        },
        employee: {
            checked: false,
            price: 5,
            number: 1
        }
    };

    /**
     * Returns a string for the storage bar
     * @return {String} "12.5%"
     */
    $scope.storagePercentage = function() {
        if (authentication.user.UsedSpace && authentication.user.MaxSpace) {
            return Math.round(100 * authentication.user.UsedSpace / authentication.user.MaxSpace) + '%';
        } else {
            // TODO: error, undefined variables
            return '';
        }
    };

    $scope.addition = function(package) {
        var total = 0;

        if(package.storage.checked) {
            total += package.storage.price * parseInt(package.storage.number);
        }

        if(package.domain.checked) {
            total += package.domain.price * parseInt(package.domain.number);
        }

        if(package.address.checked) {
            total += package.address.price * parseInt(package.address.number);
        }

        if(package.employee && package.employee.checked) {
            total += package.employee.price * parseInt(package.employee.number);
        }

        return total;
    };
});
