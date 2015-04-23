angular.module("proton.controllers.Support", [
    "proton.models"
])

.controller("SupportController", function($scope, $state, User, tools) {
    $scope.tools = tools;
    $scope.params = {};
    $scope.params.recoveryEmail = '';
    $scope.params.username = '';
    $scope.params.password = '';
    $scope.params.passwordc = '';

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
            User.confirmNewPassword({
                reset_token: $scope.params.reset_token,
                new_pwd: $scope.params.password,
                confirm_pwd: $scope.params.passwordc
            });
        }
    }

    $scope.resetMailbox = function() {
        // TODO
    };
});
