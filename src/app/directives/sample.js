angular.module("proton.sample", [])

.directive('sample', function () {

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
