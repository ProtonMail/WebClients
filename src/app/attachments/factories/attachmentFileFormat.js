angular.module('proton.attachments')
    .factory('attachmentFileFormat', () => {

        const embedded = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];

        const isEmbedded = (key) => _.contains(embedded, key);
        const getEmbedded = () => embedded;

        return { isEmbedded, getEmbedded };
    });
