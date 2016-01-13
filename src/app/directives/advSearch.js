angular.module("proton.advSearch", [])

.directive('advSearch', function ($timeout) {
    return function (scope, element, attrs) {
        var timer;

        // PANDA HELP. If you activate this code: open adv search and move mouse away - it closes. good!. but then you can never open it again...... probably some bug with scope...??

        /*
        
        element
        .bind('mouseleave', function() {
            timer = $timeout(function () {
                scope.advancedSearch = false;
            }, 1000);
        })
        .bind('mouseenter', function() {
            $timeout.cancel(timer); 
        });

        */

    };
});
