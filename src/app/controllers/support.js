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

    /**
     * Validates the token and shows the last form
     * @param form {Form}
     */
    $scope.resetLoginPass = function(form) {
        if (
            angular.isUndefined($scope.params.resetLoginCode) ||
            $scope.params.resetLoginCode.length === 0
        ) {
            $log.error('Verification Code required');
            notify({
                classes: 'notification-danger',
                message: 'Verification Code required'
            });
        }
        else {
            if (form.$valid) {
                Reset.validateResetToken({
                    username: $scope.params.username,
                    token: $scope.params.resetLoginCode
                })
                .then(
                    function(response) {
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
                    },
                    function(err) {
                        // TODO error handling?
                        $log.error(err);
                        notify({
                            classes: 'notification-danger',
                            message: 'Unable to verify reset code / token.'
                        });
                    }
                );
            }
            else {
                notify({
                    classes: 'notification-danger',
                    message: "Invalid input. Fill all required fields."
                });
            }
        }
    };

    /**
     * Request a token to reset login pass. Some validation first.
     * Shows errors otherwise sets a flag to show a different form
     */
    $scope.resetLostPassword = function(form) {
        if(form.$valid) {
            $scope.params.username = $scope.params.username.toLowerCase().split('@')[0];
            networkActivityTracker.track(
                Reset.requestResetToken({
                    Username: $scope.params.username,
                    NotificationEmail: $scope.params.recoveryEmail
                })
                .then(function(result) {
                    if (result.data && result.data.Code === 1000) {
                        $scope.inputResetToken = true;
                    } else if (result.data && result.data.Error) {
                        notify({message: result.data.Error, classes: 'notification-danger'});
                    }
                })
            );
        }
        else {
            notify({
                classes: 'notification-danger',
                message: "Invalid input. Please fill all required fields."
            });
        }
    };


    /**
     * Saves new login pass. Shows success page.
     * @param form {Form}
     */
    $scope.confirmNewPassword = function(form) {
        if(form.$valid) {
                networkActivityTracker.track(
                Reset.resetPassword({
                    Username: $scope.params.username,
                    Token: $scope.params.resetLoginCode,
                    NewPassword: $scope.params.loginPassword,
                })
                .then(
                    function(response) {
                        if (response.data.Error) {
                            notify({
                                classes: "notification-danger",
                                message: response.data.Error
                            });
                        }
                        else {
                            $state.go("support.message", {
                                data: {
                                    title: "Password updated",
                                    content: "Your login password is updated, now you can <a href='/login'>log in</a>",
                                    type: "alert-success"
                                }
                            });
                        }
                    },
                    function(response) {
                        $log.error(response);
                        // TODO error handling?
                        notify({
                            classes: "notification-danger",
                            message: response.data.Error
                        });
                    }
                )
            );
        }
        else {
            notify({
                classes: 'notification-danger',
                message: "Error: Please complete all required fields."
            });
        }
    };
});
