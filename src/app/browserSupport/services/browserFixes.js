import _ from 'lodash';

/* @ngInject */
function browserFixes(safari) {
    const browsers = [safari];

    function applyFixes() {
        _.each(browsers, (browser) => {
            if (browser.isCurrentBrowser()) {
                browser.applyFixes();
            }
        });
    }

    return { init: applyFixes };
}
export default browserFixes;
