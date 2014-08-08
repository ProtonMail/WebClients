angular.module("proton.Controllers.Messages", [
  "ngRoute",
  "proton.Routes"
])

.controller("MessageListController", function($state, $stateParams, $scope, $rootScope) {
  $rootScope.pageName = $state.current.data.mailbox;
})

.controller("ComposeMessageController", function($rootScope) {
  $rootScope.pageName = "New Message";
})

.controller("ViewMessageController", function($rootScope) {

});
