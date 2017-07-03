angular.module('proton.browserSupport')
    .factory('browserFixes', (safari) => {

        const browsers = [ safari ];

        function applyFixes() {
            _.each(browsers, (browser) => {
                if (browser.isCurrentBrowser()) {
                    browser.applyFixes();
                }
            });
        }

        return { init: applyFixes };
    });
