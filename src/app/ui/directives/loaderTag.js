angular.module('proton.ui')
    .directive('loaderTag', () => ({
        restrict: 'E',
        replace: true,
        scope: {},
        template: '<div class="loader"><em></em></div>'
    }));
