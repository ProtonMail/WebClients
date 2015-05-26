angular.module("proton.controllers.Support", [
    "proton.models"
])

.controller("SupportController", function($scope, $state, $log, User, tools) {
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
        if(form.$valid) {
            User.resetLostPassword({
                user_name: $scope.params.username,
                notification_email: $scope.params.recoveryEmail
            }).$promise.then(function(response) {
                $state.go("support.message", {data: {
                    title: "Check your Email",
                    content: "We've emailed you a secure link to reset your password.",
                    type: "alert-info"
                }});
            });
        }
    };

    $scope.confirmNewPassword = function(form) {
        if(form.$valid) {
            User.resetPassword({
                reset_token: $state.params.token,
                new_pwd: $scope.params.password,
                confirm_pwd: $scope.params.passwordc
            }).$promise.then(function(response) {
                $state.go("support.message", {data: {
                    title: "Password updated",
                    content: "Your login password is updated, now you can <a href='/login'>log in</a>",
                    type: "alert-success"
                }});
            }, function(response) {
                $state.go("support.message", {data: {
                    title: response.error,
                    content: response.error_description,
                    type: "alert-danger"
                }});
            });
        }
    };
});
