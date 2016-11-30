angular.module('proton.attachments')
    .factory('embeddedUtils', (attachmentFileFormat, tools) => {

        const DIV = document.createElement('DIV');
        const REGEXP_IS_INLINE = /^inline/i;
        const REGEXP_CID_START = /^cid:/g;
        const EMBEDDED_CLASSNAME = 'proton-embedded';

        /**
         * Flush the container HTML and return the container
         * @return {Node} Empty DIV
         */
        const getBodyParser = () => (DIV.innerHTML = '', DIV);

        /**
         * Removes enclosing quotes ("", '', &lt;&gt;) from a string
         * @param {String} value - String to be converted
         * @return {String} value - Converted string
         */
        function trimQuotes(input) {
            const value = (input || '').trim();

            if (['"', "'", '<'].indexOf(value.charAt(0)) > -1 && ['"', "'", '>'].indexOf(value.charAt(value.length - 1)) > -1) {
                return value.substr(1, value.length - 2);
            }

            return value;
        }

        const readCID = (Headers = {}) => {
            if (Headers['content-id']) {
                return trimQuotes(Headers['content-id']);
            }

            // We can find an image without cid so base64 the location
            if (Headers['content-location']) {
                return trimQuotes(Headers['content-location']);
            }

            return '';
        };

        const isInline = (Headers = {}) => {
            const value = Headers['content-disposition'] || '';
            return REGEXP_IS_INLINE.test(value)
        };

        function isEmbedded({ Headers = {}, MIMEType = '' }) {
            return isInline(Headers) && attachmentFileFormat.isEmbedded(MIMEType);
        }


        const getAttachementName = (Headers = {}) => {
            if (Headers['content-disposition'] !== 'inline') {
                const [, name ] = Headers['content-disposition'].split('filename=');

                if (name) {
                    return name.replace(/"/g, '');
                }
            }

            return '';
        };

        /**
         * Generate CID from input and email
         * @param {String} input
         * @param {String} email
         * @return {String} cid
         */
        const generateCid = (input, email) => {
            const hash = tools.hash(input).toString(16);
            const domain = email.split('@')[1];
            return `${hash}@${domain}`;
        };

        /**
         * Get the url for an embedded image
         * @param  {Node} node Image
         * @return {String}
         */
        const srcToCID = (node) => {
            const attribute = node.getAttribute('data-embedded-img') || '';
            return attribute.replace(REGEXP_CID_START, '');
        };

        const getBlobFromURL = (url = '') => {
            const xhr = new XMLHttpRequest();

            return new Promise((resolve, reject) => {

                xhr.open('GET', url, true);
                xhr.responseType = 'blob';
                xhr.onload = function onload() {
                    if (xhr.status === 200) {
                        return resolve(xhr.response);
                    }
                    reject(xhr.response);
                };

                xhr.send();
            });
        };

        return {
            isInline, isEmbedded,
            getAttachementName, generateCid, srcToCID,
            readCID, trimQuotes, getBodyParser,
            getBlobFromURL
        };
    });
