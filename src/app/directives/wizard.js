angular.module('proton.wizard', [])

.directive('wizard', function($rootScope, $timeout) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/partials/wizard.tpl.html',
        link: function(scope, element, attrs) {
            scope.$on('tourStart', function(event) {
                scope.tourStart();
            });

            scope.tourStart = function() {
                $rootScope.tourActive = true; // used for body class and CSS.
                scope.tourGo(1);
            };

            scope.tourEnd = function() {
                $rootScope.tourActive = false;
                $('.tooltip').tooltip('hide');
            };

            scope.tourNext = function() {
                if (scope.tourStep === 4) {
                    scope.tourEnd();
                } else {
                    scope.tourStep = Number(scope.tourStep + 1);
                }
            };

            scope.tourGo = function(step) {
                scope.tourStep = 0;

                $('.tooltip').tooltip('hide');

                switch (step) {
                    case 1:
                        scope.tourStep = 1;
                        break;
                    case 2:
                        scope.tourStep = 2;
                        $('#tour-jason').tooltip({
                            title: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                            placement: "right"
                        });
                        $('#tour-fromage').tooltip({
                            title: "Lorem ipsum dolor sit amet",
                            placement: "top"
                        });
                        $timeout( function() {
                            $('#tour-jason, #tour-fromage').tooltip('show');
                            $('.tooltip:visible').addClass('tour animated rubberBand');
                        }, 600);
                        break;
                    case 3:
                        scope.tourStep = 3;
                        $('#tour-jason').tooltip({
                            title: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                            placement: "right"
                        });
                        $('#tour-fromage').tooltip({
                            title: "Lorem ipsum dolor sit amet",
                            placement: "top"
                        });
                        $timeout( function() {
                            $('#tour-jason, #tour-fromage').tooltip('show');
                            $('.tooltip:visible').addClass('tour animated rubberBand');
                        }, 600);
                        break;
                    case 4:
                        scope.tourStep = 4;
                        $('#tour-jason').tooltip({
                            title: "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                            placement: "right"
                        });
                        $('#tour-fromage').tooltip({
                            title: "Lorem ipsum dolor sit amet",
                            placement: "top"
                        });
                        $timeout( function() {
                            $('#tour-jason, #tour-fromage').tooltip('show');
                            $('.tooltip:visible').addClass('tour animated rubberBand');
                        }, 600);
                        break;
                    default:
                        break;
                }
            };
        }
    };
});
