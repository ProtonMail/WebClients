angular.module('proton.wizard', [])

.directive('wizard', function($rootScope, $timeout, $state, welcomeModal, monetizeModal, donateModal, $window) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/partials/wizard.tpl.html',
        link: function(scope, element, attrs) {
            var donate = function(amount, currency) {
                donateModal.activate({
                    params: {
                        amount: amount,
                        currency: currency,
                        close: function() {
                            // Close donate modal
                            donateModal.deactivate();
                            // Start tour
                            scope.tourStart();
                        }
                    }
                });
            };

            var monetize = function() {
                monetizeModal.activate({
                    params: {
                        donate: function(amount, currency) {
                            // Close monetize modal
                            monetizeModal.deactivate();
                            // Open donate modal
                            donate(amount, currency);
                        },
                        upgrade: function() {
                            // Close monetize modal
                            monetizeModal.deactivate();
                            // Go to the dashboard page
                            $state.go('secured.dashboard', {scroll: true});
                        },
                        close: function() {
                            // Close monetize modal
                            monetizeModal.deactivate();
                            // Start tour
                            scope.tourStart();
                        }
                    }
                });
            };

            var welcome = function() {
                welcomeModal.activate({
                    params: {
                        cancel: function() {
                            welcomeModal.deactivate();
                        },
                        next: function(displayName) {
                            welcomeModal.deactivate();
                            // Open monetize modal
                            monetize();
                        }
                    }
                });
            };

            // Initialization
            $timeout(function() {
                if ($rootScope.welcome === true) {
                    $rootScope.welcome = false;
                    welcome();
                }
            }, 0);

            // Listeners
            scope.$on('tourStart', function(event) {
                scope.tourStart();
            });

            scope.$on('tourEnd', function(event) {
                scope.tourEnd();
            });

            // Functions
            scope.tourHotkeys = function(event) {
                if (event.keyCode === 37) {
                    scope.tourPrev();
                }
                else if (event.keyCode === 39) {
                    scope.tourNext();
                }
            };

            scope.tourStart = function() {
                $state.go('secured.inbox');
                $rootScope.tourActive = true; // used for body class and CSS.
                scope.tourGo(1);
                $timeout(function() {
                    var element = $window.document.getElementById("pm_wizard");

                    if (element) {
                        element.focus();
                    }
                });
            };

            scope.tourEnd = function() {
                $rootScope.tourActive = false;
                $('.tooltip').tooltip('hide');
            };

            scope.tourNext = function() {
                if (scope.tourStep !== 4) {
                    scope.tourStep = Number(scope.tourStep + 1);
                    scope.tourGo(scope.tourStep);
                }
            };

            scope.tourPrev = function() {
                if (scope.tourStep === 1) {
                    return;
                } else {
                    scope.tourStep = Number(scope.tourStep - 1);
                    scope.tourGo(scope.tourStep);
                }
            };

            scope.tourGo = function(step) {
                scope.tourStep = 0;

                $('.tooltip').tooltip('hide').tooltip('destroy');

                switch (step) {
                    case 1:
                        scope.tourStep = 1;
                        break;
                    case 2:
                        scope.tourStep = 2;
                        $('#tour-layout').tooltip({
                            title: "1",
                            placement: "left",
                            trigger: "manual"
                        });
                        $('#tour-settings').tooltip({
                            title: "2",
                            placement: "left",
                            trigger: "manual"
                        });
                        $timeout( function() {
                            $('#tour-layout, #tour-settings').tooltip('show');
                            $('.tooltip:visible').addClass('tour');
                        });
                        break;
                    case 3:
                        scope.tourStep = 3;
                        $('#tour-label-dropdown').tooltip({
                            title: "1",
                            placement: "bottom",
                            trigger: "manual"
                        });
                        $('#tour-label-settings').tooltip({
                            title: "2",
                            placement: "right",
                            trigger: "manual"
                        });
                        $timeout( function() {
                            $('#tour-label-dropdown, #tour-label-settings').tooltip('show');
                            $('.tooltip:visible').addClass('tour');
                        });
                        break;
                    case 4:
                        scope.tourStep = 4;
                        $('#tour-support').tooltip({
                            title: "1",
                            placement: "left",
                            trigger: "manual"
                        });
                        $timeout( function() {
                            $('#tour-support').tooltip('show');
                            $('.tooltip:visible').addClass('tour');
                        });
                        break;
                    default:
                        break;
                }
            };
        }
    };
});
