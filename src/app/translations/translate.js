angular.module("proton.translations", [])
    .config(['$translateProvider', function($translateProvider) {

        $translateProvider.preferredLanguage('en');

        // Example
        // $translateProvider.translations('en', {
        //     'TITLE': 'Hello',
        //     'FOO': 'This is a paragraph'
        // });

        // $translateProvider.translations('de', {
        //     'TITLE': 'Hallo',
        //     'FOO': 'Dies ist ein Absatz'
        // });

    }]);
