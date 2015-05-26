angular.module("proton.translations", [])
    .config(['$translateProvider', function($translateProvider) {

        $translateProvider.useStaticFilesLoader({
            prefix: '/assets/locales/',
            suffix: '.json'
        });

        $translateProvider.useSanitizeValueStrategy('escaped');
        $translateProvider.preferredLanguage('en');
    }]);
