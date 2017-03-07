angular.module('proton.conversation')
    .directive('listColumns', () => ({
        replace: true,
        templateUrl: 'templates/partials/conversation-list-columns.tpl.html'
    }));
