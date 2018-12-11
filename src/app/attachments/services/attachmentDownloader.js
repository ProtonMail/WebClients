import _ from 'lodash';
import saveAs from 'file-saver';
import JSZip from 'jszip';
import { decodeUtf8, arrayToBinaryString } from 'pmcrypto';

import { VERIFICATION_STATUS } from '../../constants';
import { isFileSaverSupported, isMobile } from '../../../helpers/browser';

/* @ngInject */
function attachmentDownloader(
    gettextCatalog,
    AttachmentLoader,
    embeddedUtils,
    notification,
    invalidSignature,
    SignatureVerifier,
    confirmModal
) {
    const hasFileSaverSupported = isFileSaverSupported();

    const I18N = {
        OPEN_ATTACHMENT_ON_MOBILE: gettextCatalog.getString(
            'Please tap and hold on the attachment and select Open in New Tab.',
            null,
            'Info'
        ),
        OPEN_ATTACHMENT_ON_DESKTOP: gettextCatalog.getString(
            'Please right-click on the attachment and select Save/Download As.',
            null,
            'Info'
        ),
        NOT_SUPPORTED: gettextCatalog.getString(
            'Your browser lacks features needed to download encrypted attachments directly.',
            null,
            'Error'
        ),
        BROKEN_ATT: {
            title: gettextCatalog.getString('Error decrypting attachment', null, 'Title'),
            message: (() => {
                const line1 = gettextCatalog.getString(
                    'The attachment will be downloaded but it will still be encrypted.',
                    null,
                    'Error'
                );
                const line2 = gettextCatalog.getString(
                    'You can decrypt the file with a program such as {{link}} if you have the corresponding private key.',
                    {
                        link:
                            '<a href="https://www.gnupg.org/" target="_blank" title="GnuPG is a free implementation of OpenPGP">GPG</a>'
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
            alert(
                `${I18N.NOT_SUPPORTED} ${isMobile() ? I18N.OPEN_ATTACHMENT_ON_MOBILE : I18N.OPEN_ATTACHMENT_ON_DESKTOP}`
            );
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
                return saveAs(blob, name);
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

    const getZipAttachmentName = (message) => `Attachments-${message.Subject}.zip`;

    const checkAllSignatures = async (message, attachments) => {
        const toSingleAttachment = (attachments) => {
            if (attachments.length === 1) {
                return attachments[0];
            }
            return {
                Name: getZipAttachmentName(message),
                MIMEType: 'application/zip',
                ID: 'ZIP_' + message.ID
            };
        };

        if (!isFileSaverSupported) {
            return;
        }
        // SIGNED_AND_NO_KEYS passes right through here: no warning or confirmation given!
        const invalid = _.map(attachments, (attachment) => SignatureVerifier.getVerificationStatus(attachment)).some(
            (status) => status === VERIFICATION_STATUS.SIGNED_AND_INVALID
        );

        if (!invalid) {
            return;
        }

        const attachment = toSingleAttachment(attachments);

        await invalidSignature.confirm(message, attachment);
        // we accept the signature, so don't ask again
        attachments.forEach((attachment) => invalidSignature.askAgain(message, attachment, false));
    };

    /**
     * Generate a download for an attachment
     * @param  {Object} attachment
     * @return {void}
     */
    const generateDownload = async (message, attachment) => {
        try {
            await checkAllSignatures(message, [attachment]);
        } catch (e) {
            // swallow as the user is informed already by a confirmation and actually caused this error
            return;
        }

        downloadFile(new Blob([attachment.data], { type: attachment.MIMEType }), attachment.Name, attachment.el);
    };

    /**
     * Download an attachment as a string
     * /!\ Do not use for binary content
     * @param {object} attachment
     * @param {Node} message
     */
    const downloadString = (attachment, message) => {
        return AttachmentLoader.get(attachment, message).then((buffer) => decodeUtf8(arrayToBinaryString(buffer)));
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
                MIMEType: attachment.MIMEType,
                ID: attachment.ID
            };
        } catch (e) {
            // If the decryption fails we download the encrypted version
            if (e.data) {
                return {
                    el,
                    data: e.data,
                    Name: `${attachment.Name}.pgp`,
                    MIMEType: 'application/pgp',
                    isError: true,
                    ID: attachment.ID
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
            if (!(await allowDownloadBrokenAtt())) {
                return; // We don't want to download it
            }
        }
        return generateDownload(message, att);
    };

    /**
     * The attachment's Name is not uniq we need a uniq name in order
     * to make the zip. The lib doesn't allow duplicates
     * @param  {Message} message
     * @return {Array}         Array of promises
     */
    const formatDownloadAll = (message) => {
        const { Attachments = [] } = message;
        const { list } = Attachments.reduce(
            (acc, att) => {
                if (!acc.map[att.Name]) {
                    acc.map[att.Name] = { index: 0 };
                } else {
                    acc.map[att.Name].index++;
                    // We can have an extension
                    const name = att.Name.split('.');
                    const ext = name.pop();
                    const newName = `${name.join('.')} (${acc.map[att.Name].index}).${ext}`;
                    att.Name = newName;
                }
                acc.list.push(att);
                return acc;
            },
            { list: [], map: {} }
        );

        return list.map((att) => formatDownload(att, message));
    };

    /**
     * Download all attachments as a zipfile
     * @param  {Object} message Message
     * @param  {Node} el      link clicked
     * @return {Promise}         Always success
     */
    const all = async (message = {}, el) => {
        try {
            const promises = formatDownloadAll(message);
            const list = await Promise.all(promises);

            try {
                await checkAllSignatures(message, list);
            } catch (e) {
                // swallow as the user is informed already by a confirmation and actually caused this error
                return;
            }

            // Detect if we have at least one error
            if (list.some(({ isError }) => isError)) {
                if (!(await allowDownloadBrokenAtt())) {
                    return; // We don't want to download it
                }
            }
            const zip = new JSZip();
            list.forEach(({ Name, data }) => zip.file(Name, data));
            const content = await zip.generateAsync({ type: 'blob' });
            downloadFile(content, getZipAttachmentName(message), el);
        } catch (e) {
            console.error(e);
            notification.error(I18N.ERROR_ZIP);
        }
    };

    return { isNotSupported, download, all, downloadString };
}
export default attachmentDownloader;
