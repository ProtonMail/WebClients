// UNUSED. TODO: clean these up as they are a separate repository now

angular.module("proton.controllers.Admin", [
    "proton.modals"
])

.controller("AdminController", function(
  $scope,
  alertModal
) {
    $scope.formData = {};

    $scope.inputType = function(input) {
        if ((input % 1) === 0) {
            return "userID";
        } else if (input.indexOf("@") > (-1)) {
            return "email";
        } else {
            return "username";
        }
    };

    $scope.adminLookup = function(inputType) {
        var input = $scope.formData.userLookup;

        switch (inputType) {
            case "userID":
                alert("You entered UserID " + input);
                break;
            case "email":
                alert("You entered notification email " + input);
                break;
            case "username":
                alert("You entered username " + input);
                break;
        }

        $scope.formData.userLookup = "";
    };

    $scope.adminDelete = function(inputType) {
        var input = $scope.formData.userDelete;

        switch (inputType) {
            case "userID":
                alert("You deleted UserID " + input);
                break;
            case "email":
                alert("You deleted notification email " + input);
                break;
            case "username":
                alert("You deleted username " + input);
                break;
        }

        $scope.formData.userDelete = "";
    };

    $scope.adminPwdReset = function(inputType) {
        var input = $scope.formData.userReset;

        switch (inputType) {
            case "userID":
                alert("You entered UserID " + input);
                break;
            case "email":
                alert("You entered notification email " + input);
                break;
            case "username":
                alert("You entered username " + input);
                break;
        }

        $scope.formData.userReset = "";
    };

    $scope.inviteLookup = function(inputType) {
        var input = $scope.formData.inviteLookup;

        switch (inputType) {
            case "userID":
                alert("You entered UserID " + input);
                break;
            case "email":
                alert("You entered notification email " + input);
                break;
            case "username":
                alert("You entered username " + input);
                break;
        }

        $scope.formData.inviteLookup = "";
    };

    $scope.inviteUnsend = function(inputType) {
        var input = $scope.formData.userUnsend;

        switch (inputType) {
            case "userID":
                alert("You entered UserID " + input);
                break;
            case "email":
                alert("You entered notification email " + input);
                break;
            case "username":
                alert("You entered username " + input);
                break;
        }

        $scope.formData.userUnsend = "";
    };

    $scope.inviteUpdateEmail = function(inputType) {
        var input = $scope.formData.userUpdated;

        switch (inputType) {
            case "userID":
                alert("You entered UserID " + input);
                break;
            case "email":
                alert("You entered notification email " + input);
                break;
            case "username":
                alert("You entered username " + input);
                break;
        }

        $scope.formData.userUpdated = "";
        $scope.formData.notification_email = null;
    };

    $scope.inviteUser = function(inputType) {
        var input = $scope.formData.userInvite;

        switch (inputType) {
            case "userID":
                alert("You invited UserID " + input);
                break;
            case "email":
                alert("You invited notification email " + input);
                break;
            case "username":
                alert("You invited username " + input);
                break;
        }

        $scope.formData.userInvite = "";
        this.userInvite = "";
    };
});
