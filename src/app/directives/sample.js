angular.module("proton.sample", [])

.directive('ngSample', function () {

    return {
        restrict : 'EA',
        // replace: true,
        scope: {
            messages: '=msgs'
        },
        // transclude: true,
        templateUrl: "templates/directives/sample.tpl.html"
    };

});
