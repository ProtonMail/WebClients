angular.module('proton.browserSupport')
    .factory('safari', (aboutClient) => {

        const fixes = [
            // Issue #5433: Download instead of new tab when clicking on links in emails
            () => {
                $(document).on('click.fixSafariDownloadBug', (e) => {
                    const target = e.target;
                    if (typeof target !== 'undefined' &&
                        target.tagName.toLowerCase() === 'a' &&
                        target.getAttribute('target') === '_blank' &&
                        target.hasAttribute('href')) {
                        e.preventDefault();
                        window.open(target.href);
                    }
                });
            }
        ];

        function applyFixes() {
            _.each(fixes, (fix) => fix());
        }
        return { isCurrentBrowser: aboutClient.isSafari, applyFixes };
    });
