angular.module('proton.attachments')
    .factory('attachmentDownloader', (gettextCatalog, AttachmentLoader) => {

        const NOT_SUPPORTED = gettextCatalog.getString('Your browser lacks features needed to download encrypted attachments directly. Please right-click on the attachment and select Save/Download As.', null, 'Error');

        const isNotSupported = (e) => {
            // Cf Safari
            if (e.target.href && e.target.href.search(/^data.*/) !== -1) {
                alert(NOT_SUPPORTED);
                e.preventDefault();
                e.stopPropagation();
                return true;
            }

            return false;
        };

        /**
         * Download an attachment
         * @param  {Object} attachment
         * @param  {Message} message
         * @param  {Node} el
         * @return {Promise}
         */
        const download = (attachment, message, el) => {
            return AttachmentLoader.get(attachment, message)
                .then((buffer) => ({
                    data: buffer,
                    Name: attachment.Name,
                    MIMEType: attachment.MIMEType,
                    el
                }))
                .then(AttachmentLoader.generateDownload);
        };

        return { isNotSupported, download };
    });
