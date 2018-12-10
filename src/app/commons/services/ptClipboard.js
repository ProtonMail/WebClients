import ClipboardJS from 'clipboard';

/* @ngInject */
function ptClipboard(gettextCatalog, notification) {
    const I18N = {
        SUCCESS: gettextCatalog.getString('Copied to clipboard', null, 'Info'),
        ERROR: gettextCatalog.getString('Error while copying', null, 'Error')
    };

    /**
     * Create copy action
     * @param  {Node} node Item to trigger the copy to the clipboard
     * @param  {Function} text Callback to return a string
     * @return {Object}      { I18N: <Object>, promise: <Promise>, destroy: <Function> }
     */
    const make = (node, text) => {
        // We use text as a callback to ensure we use the last version on click
        const clipboard = new ClipboardJS(node, { text });

        const promise = new Promise((resolve, reject) => {
            clipboard.on('success', () => {
                notification.success(I18N.SUCCESS);
                resolve();
            });
            clipboard.on('error', (e) => {
                notification.error(I18N.ERROR);
                reject(e);
            });
        });

        return {
            I18N,
            promise,
            destroy() {
                clipboard.destroy();
            }
        };
    };

    return make;
}
export default ptClipboard;
