angular.module("proton.controllers.Account", ["proton.tools"])

.controller("AccountController", function($scope, $state, crypto, tools, localStorageService) {
    var mellt = new Mellt();

    $scope.compatibility = tools.isCompatible();
    $scope.tools = tools;

    function generateKeys(userID, pass) {
        // Generate KeyPair
        var keyPair = crypto.generateKeysPGP(userID, pass);
    }

    $scope.start = function() {
        $scope.account = {
            username: '',
            loginPassword: '',
            loginPasswordConfirm: '',
            mailboxPassword: '',
            mailboxPasswordConfirm: '',
            notificationEmail: '',
            optIn: true
        };
        $state.go('account.step1');
    };

    $scope.saveContinue = function(form) {
        if (form.$valid) {
            $state.go('account.step2');
        }
    };

    $scope.finish = function(form) {
        if (form.$valid) {
            generateKeys('UserID', $scope.account.mailboxPassword);
        }
    };

    $scope.strength = function(password) {
        var daysToCrack = mellt.CheckPassword(password);
        var word;

        if (daysToCrack < 100) {
            word = 'Very Weak';
        } else if (daysToCrack < 1000) {
            word = 'Weak';
        } else if (daysToCrack < 10000) {
            word = 'Okay';
        } else if (daysToCrack < 100000) {
            word = 'Good';
        } else if (daysToCrack < 1000000) {
            word = 'Strong';
        } else {
            word = 'Very Strong';
        }

        return {
            number: daysToCrack,
            word: word
        };
    };

});
