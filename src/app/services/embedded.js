angular.module('proton.embedded', [])
.factory('embedded', (
    $log,
    $q,
    $state,
    $stateParams,
    $rootScope,
    authentication,
    Eo,
    notify,
    tools,
    secureSessionStorage,
    networkActivityTracker,
    AttachmentLoader,
    attachmentFileFormat) => {

    // Loop through attachments and create an array of
    // CIDs for any embedded image attachments
    const Blobs = {};
    let CIDList = {};
    const MAP_BLOBS = {};

    const REGEXP_IS_INLINE = /^inline/i;
    const REGEXP_CID_START = /^cid:/g;
    const EMBEDDED_CLASSNAME = 'proton-embedded';
    const PREFIX_DRAFT = 'draft_';
    const DIV = document.createElement('DIV');
    const urlCreator = () => window.URL || window.webkitURL;

    function isEmbedded({ Headers = {}, MIMEType = '' }) {
        const disposition = Headers['content-disposition'];

        return typeof disposition !== 'undefined' && REGEXP_IS_INLINE.test(disposition) && attachmentFileFormat.isEmbedded(MIMEType);
    }

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

    /**
     * Flush the container HTML and return the container
     * @return {Node} Empty DIV
     */
    const getBodyParser = () => (DIV.innerHTML = '', DIV);
    const actionDirection = {
        blob(nodes, cid, url) {
            _(nodes)
                .each((node) => {
                    node.src = url;
                    node.setAttribute('data-embedded-img', cid);
                    node.removeAttribute('data-src');
                    node.classList.add(EMBEDDED_CLASSNAME);
                });
        },
        cid(nodes, cid) {
            /**
             * Don't set the src attribute since it's evaluated and cid:cid create an error (#3330)
             * NET::ERR_UNKNOWN_URL_SCHEME because src="cid:xxxx" is not valid HTML
             */
            _(nodes)
                .each((node) => {
                    node.removeAttribute('data-embedded-img');
                    node.removeAttribute('src');

                    // Used later with a regexp
                    node.setAttribute('data-src', `cid:${cid}`);
                });
        }
    };

    const counterState = {
        add(message) {
            message.NumEmbedded++;
        },
        remove(message) {
            message.NumEmbedded--;
        }
    };

    /**
     * When we close the composer we need to deallocate Blobs used by this composer
     * @param  {String} 'composer.close'     EventName
     * @param  {Object} e                    Event from Angular
     * @return {String} opt.ID               ID of a message/conversation
     * @return {String} opt.ConversationID   ID of a message
     */
    $rootScope.$on('composer.close', (e, { ID, ConversationID }) => {
        const key = `${PREFIX_DRAFT}${ConversationID || ID}`;

        // Clean these blobs !
        if (MAP_BLOBS[key]) {
            deallocateList(key);
        }
    });

    /**
     * Parse the content to inject the generated blob src
     * @param  {Resource} message             Message
     * @param  {String} direction             Parsing to execute, blob || cid
     * @return {String}                       Parsed HTML
     */
    const parse = (message, direction, body) => {
        const testDiv = getBodyParser();

        // Escape  cid-errors
        testDiv.innerHTML = body.replace(/src="cid/g, 'data-src="cid');

        Object
            .keys(CIDList[message.ID] || {})
            .forEach((cid) => {
                const current = Blobs[cid];
                const url = (current) ? current.url : '';
                const selector = `img[src="${cid}"], img[data-embedded-img="cid:${cid}"], img[data-embedded-img="${cid}"], img[data-src="cid:${cid}"]`;
                const nodes = [].slice.call(testDiv.querySelectorAll(selector));

                if (nodes.length) {
                    (actionDirection[direction] || angular.noop)(nodes, cid, url);
                }
            });

        /**
         * Prevent this error (#3330):
         * NET::ERR_UNKNOWN_URL_SCHEME because src="cid:xxxx" is not valid HTML
         */
        return testDiv.innerHTML.replace(/data-src/g, 'src');
    };

    /**
     * @return {Boolean}
     */
    const xray = (message) => {
        const attachs = message.Attachments || [];
        message.NumEmbedded = 0;

        /* initiate a CID list */
        const MAP = CIDList[message.ID] = {};
        // Check if we have attachments
        if (attachs.length) {
            // Build a list of cids
            attachs.forEach((attachment) => {
                // BE require an inline content-disposition!
                if (isEmbedded(attachment)) {
                    const { Headers = {}, Name = '' } = attachment;
                    let cid;

                    if (Headers['content-id']) {
                        // remove the < >.
                        // e.g content-id: "<ii_io4oiedu2_154a668c35c08c
                        cid = trimQuotes(Headers['content-id']);
                    } else if (Headers['content-location']) {
                        // We can find an image without cid so base64 the location
                        cid = trimQuotes(Headers['content-location']);
                    }

                    Headers.embedded = 1;
                    counterState.add(message);
                    MAP[cid] = { Headers, Name };
                }
            });

            return Object.keys(MAP).length > 0;
        }

        return false;
    };

    function getHashKey(msg) {
        const isDraft = msg.isDraft ? msg.isDraft() : false;
        const prefix = isDraft ? PREFIX_DRAFT : '';
        return `${prefix}${msg.ConversationID || msg.ID}`.trim();
    }

    // Use the Blobs array to store CIDs url reference
    // once the attachment has been decrypted
    // so we can re-use the blob instead of decrypting
    // this should be rewritted a bit to work with
    // the service store
    const store = (message = { isDraft: angular.noop }, cid = '') => {
        const Attachments = CIDList[message.ID] || {};
        const { Headers = {} } = Attachments[cid] || {};
        const key = getHashKey(message);
        MAP_BLOBS[key] = MAP_BLOBS[key] || [];

        return (data, MIME) => {

            // If you switch to another conversation the MAP_BLOBS won't exist anymore
            if (MAP_BLOBS[key]) {
                // Turn the decrypted attachment data into a blob.
                let blob = new Blob([data], { type: MIME });
                // Generate the URL
                let imageUrl = urlCreator().createObjectURL(blob);
                // Store the generated URL
                Blobs[cid] = { url: imageUrl, isContentLocation: typeof Headers['content-location'] !== 'undefined' && typeof Headers['content-id'] === 'undefined' };
                // this is supposed to remove the blob so it
                // can be garbage collected. we dont save it (for now)
                blob = null;
                imageUrl = null;

                MAP_BLOBS[key].push(cid);
            }

        };
    };

    const extractAttachementName = (Headers = {}) => {
        if (Headers['content-disposition'] !== 'inline') {
            const splits = Headers['content-disposition'].split('filename=');

            if (splits.length > 0 && splits[1]) {
                return splits[1].replace(/"/g, '');
            }
        }

        return '';
    };

    /**
     * Find all attachements to inline
     * @param  {String} options.ID  Message.ID
     * @return {Array}
     */
    const findInlineAttachements = (message = {}) => {
        const { ID, Attachments = [] } = message;

        return Object
            .keys(CIDList[ID] || {})
            .reduce((acc, cid) => {
                // Extract current attachement content-id
                const contentId = CIDList[ID][cid].Headers['content-id'];
                const contentName = extractAttachementName(CIDList[ID][cid].Headers);

                // Find the matching attachement
                const attachment = Attachments
                    .filter(({ Headers = {}, Name = '' } = {}) => {
                        if (Headers['content-location']) {
                            return Name === contentName;
                        }
                        return Headers['content-id'] === contentId;
                    })[0];

                attachment && acc.push({ cid, attachment });
                return acc;
            }, []);
    };


    /**
     * Decrypt the attachment that has been detected within
     * a CID header, and store them for reusability purpose
     * @param {Resource} message
     */
    const decrypt = (message) => {
        const deferred = $q.defer();
        const list = findInlineAttachements(message);
        const user = authentication.user || { ShowEmbedded: 0 };
        const show = message.showEmbedded === true || user.ShowEmbedded === 1;

        // For a draft if we close it before the end of the attachement upload, there are no keyPackets
        const promise = _.chain(list)
            .filter(({ attachment }) => attachment.KeyPackets)
            .filter(({ cid }) => !Blobs[cid] && show)
            .map(({ cid, attachment }) => {
                const storeAttachement = store(message, cid);
                return AttachmentLoader.get(attachment, message)
                    .then((buffer) => storeAttachement(buffer, attachment.MIMEType));
            })
            .value();

        $q.all(promise)
            .then(() => {
                const computed = list
                    .reduce((acc, { cid }) => (acc[cid] = Blobs[cid], acc), Object.create(null));
                deferred.resolve(computed);
            })
            .catch(deferred.reject);

        if (!promise.length) {
          // all cid was already stored, we can resolve
            deferred.resolve({});
        }

        return deferred.promise;
    };


    // blob URLs never get deallocated automatically--
    // we manage deallocation to avoid a massive memory leak
    // once we navigate away from a conversation
    // eg. this can be triggered from the conversations controller

    function deallocate(message = {}) {
        const key = getHashKey(message);
        Object
            .keys(MAP_BLOBS)
            .filter((k) => k !== key && k.indexOf(PREFIX_DRAFT) !== 0) // Do nothing for draft and itself
            .forEach(deallocateList);
    }

    /**
     * The URL.revokeObjectURL() static method releases an existing object URL
     * which was previously created by calling URL.createObjectURL().
     * Call this method when you've finished using a object URL, in order to let
     * the browser know it doesn't need to keep the reference to the file
     * any longer.
     * @param {key}  key     Key of the message/conversation
     */
    function deallocateList(key) {
        const list = MAP_BLOBS[key] || [];
        _(list).each((cid) => {
            if (Blobs[cid]) {
                urlCreator().revokeObjectURL(Blobs[cid].url);
                // Remove the Blob ref from our store
                delete Blobs[cid];
            }
        });
        delete MAP_BLOBS[key];
    }

    const embedded = {
        isEmbedded,

        /**
         * Parse a message in order to
         *     - Find an lot its attachments
         *     - Store blobs per attachment
         *     - Bind blobs or cid to the body
         * @param  {Message} message
         * @param  {String} direction blob | cid
         * @param  {String} text      Alternative body to parse
         * @return {Promise}
         */
        parser(message, direction = 'blob', text = '') {
            CIDList = {};

            const deferred = $q.defer();
            const content = text || message.getDecryptedBody();
            console.log('MONIQUE')
            if (xray(message, content)) {
                // Check if the content has cid attachments
                if (Object.keys(CIDList).length > 0) {
                    // Decrypt, then return the parsed content
                    decrypt(message, content)
                    .then(() => parse(message, direction, content))
                    .then((content) => {
                        deferred.resolve(content);
                    })
                    .catch((error) => {
                        $log.error(error);
                        deferred.reject(error);
                    });

                } else {
                    // Resolve the decrypted body
                    deferred.resolve(content);
                }
            } else {
                deferred.resolve(content);
            }

            return deferred.promise;

        },
        getCid(headers) {
            return headers && (trimQuotes(headers['content-id']) || headers['content-location']);
        },
        getBlob(cid) {
            const xhr = new XMLHttpRequest();
            const deferred = $q.defer();

            xhr.open('GET', Blobs[cid].url, true);
            xhr.responseType = 'blob';
            xhr.onload = function onload() {
                if (this.status === 200) {
                    deferred.resolve(this.response);
                }
            };

            xhr.send();

            return deferred.promise;
        },
        addEmbedded(message, cid, data, MIME) {
            store(message, cid)(data, MIME);
            return Blobs[cid];
        },
        removeEmbedded(message, Headers, content = '') {
            const disposition = Headers['content-disposition'];

            if (disposition && REGEXP_IS_INLINE.test(disposition)) {

                let cid;

                if (Headers['content-id']) {
                    // remove the < >.
                    // e.g content-id: "<ii_io4oiedu2_154a668c35c08c
                    cid = trimQuotes(Headers['content-id']);
                } else if (Headers['content-location']) {
                    // We can find an image without cid so base64 the location
                    cid = trimQuotes(Headers['content-location']);
                }

                const tempDOM = $(`<div>${content || message.getDecryptedBody()}</div>`);
                counterState.remove(message);
                const nodes = tempDOM.find(`img[src="cid:${cid}"], img[data-embedded-img="cid:${cid}"], img[data-embedded-img="${cid}"]`);
                if (nodes.length > 0) {
                    nodes.remove();
                }

                message.setDecryptedBody(tempDOM.html(), true);
            }

            return message.getDecryptedBody();
        },
        deallocator: deallocate,

        /**
         * Get the url for an embedded image
         * @param  {Node} node Image
         * @return {String}
         */
        getUrl(node) {
            const attribute = node.getAttribute('data-embedded-img') || '';
            const cid = attribute.replace(REGEXP_CID_START, '');
            const { url = '' } = Blobs[cid] || {};

            return url;
        },

        /**
         * Check if attachment exist
         * @param  {Resource} message
         * @param  {String} src - cid:url
         * @return {Object}
         */
        getAttachment(message, src) {
            const cid = src.replace(REGEXP_CID_START, '');
            const resultXray = xray(message);

            if (resultXray && CIDList[message.ID]) {
                return CIDList[message.ID][cid] || {};
            }
        },
        /**
         * Check if the cid exist for a specific message
         * @param {Resource} message
         * @param {String} cid
         * @return {Boolean}
         */
        exist(message, cid) {
            return typeof CIDList[message.ID] !== 'undefined' && typeof CIDList[message.ID][cid] !== 'undefined';
        },
        /**
         * Generate CID from input and email
         * @param {String} input
         * @param {String} email
         * @return {String} cid
         */
        generateCid(input, email) {
            const hash = tools.hash(input).toString(16);
            const domain = email.split('@')[1];
            return `${hash}@${domain}`;
        }
    };

    return embedded;

});
