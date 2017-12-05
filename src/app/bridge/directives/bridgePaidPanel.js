angular.module('proton.bridge')
    .directive('bridgePaidPanel', () => {
        return {
            replace: true,
            restrict: 'E',
            scope: {},
            templateUrl: 'templates/bridge/bridgePaidPanel.tpl.html'
        };
    });
