angular.module('proton.core')
    .factory('downloadFile', (gettextCatalog, notify, aboutClient) => {
        const newerBrowser = gettextCatalog.getString('Download requires a newer browser.', null, 'Error');
        const learnMore = gettextCatalog.getString('Learn more.', null, 'Info');

        return (blob, filename) => {
            try {
                if (!aboutClient.isFileSaverSupported()) {
                    throw new Error(newerBrowser);
                }
                window.saveAs(blob, filename);
            } catch (error) {
                // TODO add link
                notify({ message: `${newerBrowser} <a href="https://protonmail.com/support/knowledge-base/problems-with-attachments/" target="_blank">${learnMore}</a>`, classes: 'notification-danger' });
                console.error(error);
            }
        };
    });
