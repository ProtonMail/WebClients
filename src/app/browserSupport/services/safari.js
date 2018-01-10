import _ from 'lodash';

/* @ngInject */
function safari(aboutClient) {
    const fixes = [
        // Issue #5433: Download instead of new tab when clicking on links in emails
        () => {
            $(document).on('click.fixSafariDownloadBug', (e) => {
                const target = e.target;
                if (target && target.tagName === 'A' && target.getAttribute('target') === '_blank' && target.hasAttribute('href')) {
                    e.preventDefault();
                    window.open(target.href);
                }
            });
        }
    ];

    const applyFixes = () => _.each(fixes, (fix) => fix());

    return { isCurrentBrowser: aboutClient.isSafari, applyFixes };
}
export default safari;
