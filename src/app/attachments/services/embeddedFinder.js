angular.module('proton.attachments')
    .factory('embeddedFinder', (embeddedStore, attachmentFileFormat) => {

        const REGEXP_IS_INLINE = /^inline/i;

        function isEmbedded({ Headers = {}, MIMEType = '' }) {
            const disposition = Headers['content-disposition'];

            return typeof disposition !== 'undefined' && REGEXP_IS_INLINE.test(disposition) && attachmentFileFormat.isEmbedded(MIMEType);
        }

        const find = (message) => {
            const list = message.getAttachments();

            if (!list.length) {
                return false;
            }

            _.each(list, (attachment) => {
                if (isEmbedded(attachment)) {
                    embeddedStore.cid.add(message, attachment);
                }
            });

            return embeddedStore.cid.contains(message);
        };

        const extractAttachementName = (Headers = {}) => {
            if (Headers['content-disposition'] !== 'inline') {
                const [, name ] = Headers['content-disposition'].split('filename=');

                if (name) {
                    return name.replace(/"/g, '');
                }
            }

            return '';
        };

        const listInlineAttachments = (message) => {
            const list = message.getAttachments();
            const MAP_CID = embeddedStore.cid.get(message);

            return Object.keys(MAP_CID)
                .reduce((acc, cid) => {
                    // Extract current attachement content-id
                    const contentId = MAP_CID[cid].Headers['content-id'];
                    const contentName = extractAttachementName(MAP_CID[cid].Headers);

                    // Find the matching attachement
                    const attachment = list.filter(({ Headers = {}, Name = '' } = {}) => {
                        if (Headers['content-location']) {
                            return Name === contentName;
                        }
                        return Headers['content-id'] === contentId;
                    })[0];

                    attachment && acc.push({ cid, attachment });
                    return acc;
                }, []);
        };


        return { find, listInlineAttachments };
    });
