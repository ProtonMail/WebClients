angular.module("proton.controllers.Support", [
    "proton.models"
])

.controller("SupportController", function(
    $scope,
    $state,
    $log,
    User,
    tools,
    notify,
    Reset,
    networkActivityTracker
) {
    $scope.tools = tools;
    $scope.params = {};
    $scope.params.recoveryEmail = '';
    $scope.params.username = '';
    $scope.params.password = '';
    $scope.params.passwordc = '';

    $scope.showForm = false;

    $scope.getMessageTitle = function() {
        return $state.params.data.title || "";
    };

    $scope.getMessageContent = function() {
        return $state.params.data.content || "";
    };

    $scope.getMessageType = function() {
        return $state.params.data.type || "";
    };

    $scope.resetLoginPass = function(form) {
        $log.debug('resetLoginPass');
        if (
            angular.isUndefined($scope.params.resetLoginCode) ||
            $scope.params.resetLoginCode.length === 0
        ) {
            $log.error('Verification Code required');
            notify('Verification Code required');
        }
        else {
            if (form.$valid) {
                $log.debug('finishLoginReset: form valid');
                Reset.validateResetToken({
                    username: $scope.params.username,
                    token: $scope.params.resetLoginCode
                })
                .then( function(response) {
                    if (response.data.Code!==1000) {
                        notify({
                            classes: 'notification-danger',
                            message: 'Invalid Verification Code.'
                        });
                    }
                    else {
                        // show the form.
                        $scope.newLoginInput = true;
                    }
                });
            }
        }
    };

    $scope.finishLoginPassReset = function(form) {

    };

    $scope.resetLostPassword = function(form) {
        $log.debug('resetLostPassword');
        if(form.$valid) {
            $scope.params.username = $scope.params.username.toLowerCase().split('@')[0];
            $log.debug('resetLostPassword: form valid');
            networkActivityTracker.track(
                Reset.requestResetToken({
                    Username: $scope.params.username,
                    NotificationEmail: $scope.params.recoveryEmail
                }).then(
                    function(response) {
                        if (response.data.Code!==1000) {
                            notify({
                                classes: 'notification-danger',
                                message: 'Wrong username or recovery email.'
                            });
                        }
                        else {
                            $scope.inputResetToken = true;
                        }
                    },
                    function() {
                        notify('Unable to reset password. Please try again in a few minutes.');
                    }
                )
            );
        }
    };

    $scope.confirmNewPassword = function(form) {
        $log.debug('confirmNewPassword');
        if(form.$valid) {
                $log.debug('confirmNewPassword: form valid');
                networkActivityTracker.track(
                Reset.resetPassword({
                    Username: $scope.params.username,
                    Token: $scope.params.resetLoginCode,
                    NewPassword: $scope.params.loginPassword,
                }).then(
                    function(response) {
                        $log.debug(response);
                        if (response.data.Error) {
                            notify({
                                classes: "notification-danger",
                                message: response.data.Error
                            });
                        }
                        else {
                            $state.go("support.message", {data: {
                                title: "Password updated",
                                content: "Your login password is updated, now you can <a href='/login'>log in</a>",
                                type: "alert-success"
                            }});
                        }
                    },
                    function(response) {
                        notify({
                            classes: "notification-danger",
                            message: response.data.Error
                        });
                    }
                )
            );
        }
    };
});
