import saveAs from 'file-saver';

import { isFileSaverSupported } from '../../../helpers/browser';

/* @ngInject */
function downloadFile(gettextCatalog, notification, translator) {
    const I18N = translator(() => ({
        NEWER_BROWSER: gettextCatalog.getString('Download requires a newer browser.', null, 'Error'),
        LEARN_MORE: gettextCatalog.getString('Learn more.', null, 'Info')
    }));

    return (blob, filename) => {
        try {
            if (!isFileSaverSupported()) {
                throw new Error(I18N.NEWER_BROWSER);
            }
            saveAs(blob, filename);
        } catch (error) {
            notification.error(
                `${
                    I18N.NEWER_BROWSER
                } <a href="https://protonmail.com/support/knowledge-base/problems-with-attachments/" target="_blank">${
                    I18N.LEARN_MORE
                }</a>`
            );
            console.error(error);
        }
    };
}
export default downloadFile;
