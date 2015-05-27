angular.module("proton.translations", [])
    .config(['$translateProvider', function($translateProvider) {

        $translateProvider.useStaticFilesLoader({
            prefix: '/assets/locales/',
            suffix: '.json'
        });

        $translateProvider.useSanitizeValueStrategy('escaped');
        $translateProvider.useLocalStorage(); // App uses a localStorage to remember the user's language.
        $translateProvider.preferredLanguage('en_US'); // TODO load user preference
    }]);
