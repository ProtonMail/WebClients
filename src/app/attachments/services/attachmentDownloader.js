/* @ngInject */
function attachmentDownloader(gettextCatalog, AttachmentLoader, embeddedUtils, aboutClient, notification) {
    const isFileSaverSupported = aboutClient.isFileSaverSupported();
    const I18N = {
        NOT_SUPPORTED: gettextCatalog.getString(
            'Your browser lacks features needed to download encrypted attachments directly. Please right-click on the attachment and select Save/Download As.',
            null,
            'Error'
        ),
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
            if (isFileSaverSupported) {
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
     * Format attachment for the download
     * @param  {Object} attachment
     * @param  {Object} message    Message
     * @param  {Node} el         Link clicked
     * @return {Promise}
     */
    const formatDownload = (attachment, message, el) => {
        return AttachmentLoader.get(attachment, message).then((buffer) => ({
            data: buffer,
            Name: attachment.Name,
            MIMEType: attachment.MIMEType,
            el
        }));
    };

    /**
     * Download an attachment
     * @param  {Object} attachment
     * @param  {Message} message
     * @param  {Node} el
     * @return {Promise}
     */
    const download = (attachment, message, el) => {
        return formatDownload(attachment, message, el).then(generateDownload);
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
            const zip = new window.JSZip();
            list.forEach(({ Name, data }) => zip.file(Name, data));
            const content = await zip.generateAsync({ type: 'blob' });
            downloadFile(content, `Attachments-${message.Subject}.zip`, el);
        } catch (e) {
            console.error(e);
            notification.error(I18N.ERROR_ZIP);
        }
    };

    return { isNotSupported, download, all };
}
export default attachmentDownloader;
