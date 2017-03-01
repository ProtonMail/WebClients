angular.module('proton.settings')
    .directive('headerBlock', () => ({
        replace: true,
        transclude: true,
        template: '<header class="headerBlock-container" ng-transclude></header>'
    }));
