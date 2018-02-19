import _ from 'lodash';
import { isFileSaverSupported } from '../../../helpers/browser';

/* @ngInject */
function attachmentDownloader(gettextCatalog, AttachmentLoader, embeddedUtils, notification, AppModel, confirmModal, pmcw) {

    const hasFileSaverSupported = isFileSaverSupported();

    const I18N = {
        NOT_SUPPORTED: gettextCatalog.getString(
            'Your browser lacks features needed to download encrypted attachments directly. Please right-click on the attachment and select Save/Download As.',
            null,
            'Error'
        ),
        BROKEN_ATT: {
            title: gettextCatalog.getString('Error decrypting attachment', null, 'Title'),
            message: (() => {
                const line1 = gettextCatalog.getString('The attachment will be downloaded but it will still be encrypted.', null, 'Error');
                const line2 = gettextCatalog.getString(
                    'You can decrypt the file with a program such as {{link}} if you have the corresponding private key.',
                    {
                        link: '<a href="https://www.gnupg.org/" target="_blank" title="GnuPG is a free implementation of OpenPGP">GPG</a>'
                    },
                    'Info'
                );
                return `${line1}<br><br>${line2}`;
            })(),
            confirmText: gettextCatalog.getString('Download', null, 'Action')
        },
        ERROR_ZIP: gettextCatalog.getString('Cannot generate a zip of your attachments.', null, 'Error')
    };

    const isNotSupported = (e) => {
        // Cf Safari
        if (e.target.href && e.target.href.search(/^data.*/) !== -1) {
            alert(I18N.NOT_SUPPORTED);
            e.preventDefault();
            e.stopPropagation();
            return true;
        }

        return false;
    };

    /**
     * Auto download a file
     * @param  {Blob} blob
     * @param  {String} name Download filename
     * @param  {Node} el   Link clicked (fallback mode)
     * @return {void}
     */
    const downloadFile = (blob, name, el) => {
        try {
            if (hasFileSaverSupported) {
                return window.saveAs(blob, name);
            }

            // Bad blob support, make a data URI, don't click it
            const reader = new FileReader();
            reader.onloadend = () => {
                el.href = reader.result;
            };

            reader.readAsDataURL(blob);
        } catch (error) {
            console.error(error);
        }
    };

    /**
     * Generate a download for an attachment
     * @param  {Object} attachment
     * @return {void}
     */
    const generateDownload = (attachment) => {
        downloadFile(new Blob([attachment.data], { type: attachment.MIMEType }), attachment.Name, attachment.el);
    };

    /**
     * Download an attachment as a string
     * @param {object} attachment
     * @param {Node} message
     */
    const downloadString = (attachment, message) => {
        return AttachmentLoader.get(attachment, message).then((buffer) => pmcw.arrayToBinaryString(buffer));
    };

    const allowDownloadBrokenAtt = () =>
        new Promise((resolve) => {
            const params = _.extend(
                {
                    isWarning: true,
                    confirm() {
                        resolve(true);
                        confirmModal.deactivate();
                    },
                    cancel() {
                        resolve(false);
                        confirmModal.deactivate();
                    }
                },
                I18N.BROKEN_ATT
            );
            confirmModal.activate({ params });
        });

    /**
     * Format attachment for the download
     * @param  {Object} attachment
     * @param  {Object} message    Message
     * @param  {Node} el         Link clicked
     * @return {Promise}
     */
    const formatDownload = async (attachment, message, el) => {
        try {
            const data = await AttachmentLoader.get(attachment, message);
            return {
                el,
                data,
                Name: attachment.Name,
                MIMEType: attachment.MIMEType
            };
        } catch (e) {
            // If the decryption fails we download the encrypted version
            if (e.data) {
                return {
                    el,
                    data: e.data,
                    Name: `${attachment.Name}.pgp`,
                    MIMEType: 'application/pgp',
                    isError: true
                };
            }
            throw e;
        }
    };

    /**
     * Download an attachment
     * @param  {Object} attachment
     * @param  {Message} message
     * @param  {Node} el
     * @return {Promise}
     */
    const download = async (attachment, message, el) => {
        const att = await formatDownload(attachment, message, el);
        if (att.isError) {
            if (!await allowDownloadBrokenAtt()) {
                return; // We don't want to download it
            }
        }
        return generateDownload(att);
    };

    /**
     * Download all attachments as a zipfile
     * @param  {Object} message Message
     * @param  {Node} el      link clicked
     * @return {Promise}         Always success
     */
    const all = async (message = {}, el) => {
        try {
            const promises = (message.Attachments || []).filter((att) => !embeddedUtils.isEmbedded(att)).map((att) => formatDownload(att, message));

            const list = await Promise.all(promises);

            // Detect if we have at least one error
            if (list.some(({ isError }) => isError)) {
                if (!await allowDownloadBrokenAtt()) {
                    return; // We don't want to download it
                }
            }
            const zip = new window.JSZip();
            list.forEach(({ Name, data }) => zip.file(Name, data));
            const content = await zip.generateAsync({ type: 'blob' });
            downloadFile(content, `Attachments-${message.Subject}.zip`, el);
        } catch (e) {
            console.error(e);
            notification.error(I18N.ERROR_ZIP);
        }
    };

    return { isNotSupported, download, all, downloadString };
}
export default attachmentDownloader;
