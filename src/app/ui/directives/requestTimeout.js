angular.module('proton.ui')
.directive('requestTimeout', () => {

    return {
        replace: true,
        templateUrl: 'templates/directives/ui/requestTimeout.tpl.html'
    };
});
