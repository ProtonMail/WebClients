angular.module("proton.controllers.Settings", []);


//     $scope.tools = tools;

//     // Not used
//     $scope.saveMessageButtons = function(form) {
//         networkActivityTracker.track(
//             Setting.setMessageStyle({
//                 "MessageButtons": parseInt($scope.MessageButtons)
//             }).$promise.then(
//                 function(response) {
//                     if(response.Code === 1000) {
//                         notify({message: $translate.instant('THEME_SAVED'), classes: 'notification-success'});
//                         authentication.user.MessageButtons = $scope.MessageButtons;
//                     } else if (response.Error) {
//                         notify({message: response.Error, classes: 'notification-danger'});
//                     }
//                 },
//                 function(error) {
//                     notify({message: 'Error during the appearance edition request', classes: 'notification-danger'});
//                     $log.error(error);
//                 }
//             )
//         );
//     };
