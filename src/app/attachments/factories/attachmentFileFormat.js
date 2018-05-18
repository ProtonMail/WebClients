import _ from 'lodash';
import { isSafari, isIE11 } from '../../../helpers/browser';
import { MIME_TYPES } from '../../constants';

const { DEFAULT, PLAINTEXT } = MIME_TYPES;

/* @ngInject */
function attachmentFileFormat() {
    const embedded = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];
    const isEmbedded = (key) => _.includes(embedded, key);
    const getEmbedded = () => embedded;

    /**
     * Filter the type of MIMEType uploadable
     * @param  {String} type
     * @return {Boolean}      True if we can upload the item
     */
    const isUploadMIMEType = (type) => {
        // Prehistory, with IE you can be Files or Text.
        if (isIE11()) {
            return type !== 'Text';
        }
        return type !== DEFAULT && type !== PLAINTEXT && type !== 'text/uri-list';
    };

    /**
     * Check if the content is uploadable or not
     * Not uploadable:
     *     - Drag and drop of an image from the composer to the composer
     *     - Drag and drop of text from the composer to the composer
     * @param  {dataTransfer} options.dataTransfer
     * @return {Boolean}
     */
    const isUploadAbleType = ({ dataTransfer }) => {
        const list = [...(dataTransfer.types || [])];

        // Can be a drag and drop of an image inside the composer
        if (isIE11() && !list.length) {
            return false;
        }

        if (isSafari()) {
            return list.some((type) => type === 'Files');
        }

        return list.every(isUploadMIMEType);
    };

    const receivedUnencrypted = ({ Headers = {} }) => {
        return Headers['x-pm-content-encryption'] === 'on-delivery';
    };

    return { isEmbedded, getEmbedded, isUploadAbleType, receivedUnencrypted, isUploadMIMEType };
}
export default attachmentFileFormat;
