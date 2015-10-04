angular.module("proton.sample", [])

.directive('sample', function () {

    return {
        restrict : 'E',
        scope: {
            call: '&messages'
        },
        link: function(scope, element, attrs) {
            scope.messages = scope.call();
        },
        templateUrl: "templates/directives/sample.tpl.html"
    };

});
