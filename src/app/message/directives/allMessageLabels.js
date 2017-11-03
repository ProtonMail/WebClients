angular.module('proton.message')
    .directive('allMessageLabels', () => {
        return {
            replace: true,
            templateUrl: 'templates/message/allMessageLabels.tpl.html'
        };
    });
