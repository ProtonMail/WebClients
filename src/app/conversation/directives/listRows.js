angular.module('proton.conversation')
    .directive('listRows', () => ({
        replace: true,
        templateUrl: 'templates/partials/conversation-list-rows.tpl.html'
    }));
