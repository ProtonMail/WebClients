angular.module("proton.controllers.Account", ["proton.tools"])

.controller("AccountController", function($scope, $state, User, crypto, tools, localStorageService) {
    var mellt = new Mellt();

    $scope.compatibility = tools.isCompatible();
    $scope.tools = tools;

    function generateKeys(userID, pass) {
        // Generate KeyPair
        var keyPair = crypto.generateKeysPGP(userID, pass);

        var params = {
            "response_type": "token",
            "client_id": "demoapp",
            "client_secret": "demopass",
            "grant_type": "password",
            "redirect_uri": "https://protonmail.ch",
            "state": "random_string",
            "username": $scope.account.username,
            "password": $scope.account.loginPassword,
            "email": $scope.account.notificationEmail,
            "news": !!($scope.account.optIn),
            "public": keyPair.publicKeyArmored,
            "private": keyPair.privateKeyArmored
        };

        User.createUser(params).$promise.then(function(response) {

        });

        // keyPair.then(function(keyPair) {

        //     $('#setup_step1').hide();
        //     $('#setup_step2').fadeIn();

        //     setTimeout(function() {

        //         // Save KeyPair via AJAX. Note, the PrivateKey is encrypted already
        //         $.post("/api/save-keys", {
        //                 pbk: keyPair.publicKeyArmored,
        //                 pvk: keyPair.privateKeyArmored
        //             }, function(data) {

        //                 // If successfull:
        //                 if (data == 1) {

        //                     $('#setup_step2').hide();
        //                     $('#setup_step3').fadeIn();
        //                     $('.fa-circle-o-notch').removeClass('fa-spin').removeClass('fa-circle-o-notch').addClass('fa-check-circle-o');

        //                     // Save the Mailbox pass to sessionStorage (backend can't access this)
        //                     sessionStorage.setItem('protonmail_pw', pmcrypto.encode_utf8_base64(pass));

        //                     // Set a cookie via AJAX (must be set via backend because of HTTPOnly flag)
        //                     $.getJSON("/api/set-cookie/protonmail_pw/true", function(data) {

        //                         // Redirect to welcome if its the first time
        //                         if ($('#isRegen').val() === 'true') {
        //                             setTimeout(function() {
        //                                 window.location = '/inbox';
        //                             }, 2000);
        //                         } else {
        //                             setTimeout(function() {
        //                                 window.location = '/welcome';
        //                             }, 2000);
        //                         }

        //                     })

        //                     // Unable to save the cookie..
        //                     .fail(function() {
        //                         alert("Unable to setup account.");
        //                     });

        //                 }

        //                 // Ajax Saving failed :(
        //                 else {

        //                     // Renable the button to try again
        //                     $('#loadingModal .modal-footer .btn').attr('disabled', false);

        //                     // Debugging
        //                     console.log('data: ' + data);

        //                     // Let the user know something went wrong
        //                     alert('Unable to save generated keys.');

        //                 }

        //             })
        //             .fail(function() {

        //                 // Renable the button to try again
        //                 $('#loadingModal .modal-footer .btn').attr('disabled', false);

        //                 // Let the user know something went wrong
        //                 alert('Unable to save generated keys.');
        //             });

        //     }, 3000);

        // });

        keyPair.catch(function(err) {
            console.error(err);
            alert('Unable to generate keys.');
        });
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
