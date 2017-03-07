angular.module('proton.composer')
    .directive('composerMessage', () => ({
        replace: true,
        scope: {},
        templateUrl: 'templates/partials/composer.tpl.html',
        controller: 'ComposeMessageController'
    }));
