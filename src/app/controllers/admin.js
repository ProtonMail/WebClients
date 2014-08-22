angular.module("proton.Controllers.Admin", [])

.controller("AdminController", function($scope){
  $scope.formData = {};

  $scope.inputType = function(input) {
    if ((input % 1) === 0) {
      return "userID";
    }
    else if (input.indexOf("@") > (-1)){
      return "email";
    }
    else {
      return "username";
    }
  };

  $scope.adminLookup = function(inputType) {
    switch (inputType) {
      case "userID":
        alert("You entered a UserID");
        break;
      case "email":
        alert("You entered a notification email");
        break;
      case "username":
        alert("You entered a username");
        break;
    }
      $scope.formData.userLookup = "";
  };

  $scope.adminDelete = function(inputType) {
    switch (inputType) {
      case "userID":
        alert("You entered a UserID");
        break;
      case "email":
        alert("You entered a notification email");
        break;
      case "username":
        alert("You entered a username");
        break;
    }
      $scope.formData.userDelete = "";
  };

  $scope.adminPwdReset = function(inputType) {
    switch (inputType) {
      case "userID":
        alert("You entered a UserID");
        break;
      case "email":
        alert("You entered a notification email");
        break;
      case "username":
        alert("You entered a username");
        break;
    }
      $scope.formData.userReset = "";
  };

  $scope.inviteLookup = function(inputType) {
    switch (inputType) {
      case "userID":
        alert("You entered a UserID");
        break;
      case "email":
        alert("You entered a notification email");
        break;
      case "username":
        alert("You entered a username");
        break;
    }
      $scope.formData.inviteLookup = "";
  };

  $scope.inviteUnsend = function(inputType) {
    switch (inputType) {
      case "userID":
        alert("You entered a UserID");
        break;
      case "email":
        alert("You entered a notification email");
        break;
      case "username":
        alert("You entered a username");
        break;
    }
      $scope.formData.userUnsend = "";
  };

  $scope.inviteUpdateEmail = function(inputType) {
    switch (inputType) {
      case "userID":
        alert("You entered a UserID");
        break;
      case "email":
        alert("You entered a notification email");
        break;
      case "username":
        alert("You entered a username");
        break;
    }
    $scope.formData.userUpdated = "";
    $scope.formData.notification_email = null;
  };

  $scope.inviteUser = function(inputType) {
    switch (inputType) {
      case "userID":
        alert("You entered a UserID");
        break;
      case "email":
        alert("You entered a notification email");
        break;
      case "username":
        alert("You entered a username");
        break;
    }
      $scope.formData.userInvite = "";
  };
});
