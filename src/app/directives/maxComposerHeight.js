angular.module('proton.maxComposerHeight', [])

.directive('maxComposerHeight', function ($window, $timeout) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var setHeight = function() {

                var parent = angular.element(element).closest('.composer');

                // Set to zero
                angular.element(element).find('iframe, .angular-squire-wrapper').css({ height: 0 });

                var height = parent.outerHeight();

                height -= parent.find('header').outerHeight();
                height -= parent.find('.meta').outerHeight();
                height -= parent.find('.squire-toolbar').outerHeight();
                height -= parent.find('footer').outerHeight();
                height -= parent.find('.attachmentBar:visible').outerHeight();
                height -= parent.find('.attachmentArea:visible').outerHeight();

                // console.log(
                //     parent.outerHeight(),
                //     parent.find('header').outerHeight(),
                //     parent.find('.meta').outerHeight(),
                //     parent.find('.squire-toolbar').outerHeight(),
                //     parent.find('footer').outerHeight(),
                //     parent.find('.attachmentBar:visible').outerHeight(),
                //     parent.find('.attachmentArea:visible').outerHeight()
                // );

                height = (height < 200) ? 200 : height;

                console.log(height);

                angular.element(element).find('iframe, .angular-squire-wrapper').css({
                    height: height
                });
            };

            // Listen resize window
            angular.element($window).bind('resize', setHeight);

            // Listen state change
            scope.$on('$stateChangeSuccess', function() {
                setHeight();
            });

            // Listen composer mode change
            scope.$on('composerModeChange', function() {
                $timeout( setHeight, 100);
            });

            // Remove listener on resize window
            scope.$on('$destroy', function() {
                angular.element($window).unbind('resize', setHeight);
            });

            // Delay the first call
            $timeout(function() {
                setHeight();
            });
        }
    };
});
