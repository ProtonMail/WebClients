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

    $scope.resetLostPassword = function(form) {
        $log.debug('resetLostPassword');
        if(form.$valid) {
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
                            $state.go("support.message", {
                                data: {
                                    title: "Check your Email",
                                    content: "We've emailed you a secure link to reset your password.",
                                    type: "alert-info"
                                }
                            });
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
        if(form.$valid) {
                networkActivityTracker.track(
                Reset.resetPassword({
                    Token: $state.params.token,
                    NewPassword: $scope.params.password,
                }).then(
                    function(response) {
                        if (response.data.Error) {
                            notify(response.data.Error);
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
                        $state.go("support.message", {data: {
                            title: response.data.Error,
                            content: response.data.Error,
                            type: "alert-danger"
                        }});
                    }
                )
            );
        }
    };
});
