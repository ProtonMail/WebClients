import { isFileSaverSupported } from '../../../helpers/browser';

/* @ngInject */
function downloadFile(gettextCatalog, notification) {
    const newerBrowser = gettextCatalog.getString('Download requires a newer browser.', null, 'Error');
    const learnMore = gettextCatalog.getString('Learn more.', null, 'Info');

    return (blob, filename) => {
        try {
            if (!isFileSaverSupported()) {
                throw new Error(newerBrowser);
            }
            window.saveAs(blob, filename);
        } catch (error) {
            // TODO add link
            notification.error(
                `${newerBrowser} <a href="https://protonmail.com/support/knowledge-base/problems-with-attachments/" target="_blank">${learnMore}</a>`
            );
            console.error(error);
        }
    };
}
export default downloadFile;
