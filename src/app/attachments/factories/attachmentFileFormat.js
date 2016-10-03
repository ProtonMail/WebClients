angular.module('proton.attachments')
    .factory('attachmentFileFormat', () => {

        const embedded = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];

        const isEmbedded = (key) => _.contains(embedded, key);
        const getEmbedded = () => embedded;

        /**
         * Check if the content is uploadable or not
         * Not uploadable:
         *     - Drag and drop of an image from the composer to the composer
         *     - Drag and drop of text from the composer to the composer
         * @param  {dataTransfer} options.dataTransfer
         * @return {Boolean}
         */
        const isUploadAbleType = ({ dataTransfer }) => {
            return (dataTransfer.types || [])
                .every((type) => type !== 'text/html' && type !== 'text/plain' && type !== 'text/uri-list');
        };

        return { isEmbedded, getEmbedded, isUploadAbleType };
    });
