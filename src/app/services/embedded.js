angular.module("proton.embedded", [])
.factory("embedded", function(
    $log,
    $q,
    $state,
    $stateParams,
    $rootScope,
    attachments,
    authentication,
    Eo,
    notify,
    secureSessionStorage,
    networkActivityTracker,
    pmcw
) {

    // Loop through attachments and create an array of
    // CIDs for any embedded image attachments
    var Blobs = {};
    let CIDList = {};
    let MAP_BLOBS = {};

    const MIMETypeSupported = ['image/gif', 'image/jpeg', 'image/png', 'image/bmp'];
    const REGEXP_IS_INLINE = /^inline/i;
    const REGEXP_CID_CLEAN = /[<>]+/g;
    const REGEXP_CID_START = /^cid:/g;
    const EMBEDDED_CLASSNAME = 'proton-embedded';
    const PREFIX_DRAFT = 'draft_';
    const DIV = document.createElement('DIV');
    const urlCreator = () => window.URL || window.webkitURL;

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
                    node.rel = cid;
                    node.classList.add(EMBEDDED_CLASSNAME);
                });
        },
        cid(nodes, cid, url) {
            /**
             * Don't set the src attribute since it's evaluated and cid:cid create an error (#3330)
             * NET::ERR_UNKNOWN_URL_SCHEME because src="cid:xxxx" is not valid HTML
             */
            _(nodes)
                .each((node) => {
                    node.removeAttribute('src');

                    // Used later with a regexp
                    node.setAttribute('data-src', `cid:${cid}`);
                });
        }
    };

    const counterState = {
        add(message){
            message.NumEmbedded = message.NumEmbedded + 1;
        },
        remove(message){
            message.NumEmbedded = message.NumEmbedded-1;
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
     * because the blob live inside the browser we may
     * set an extra rel attribute so we can update the blob src later
     * @param  {Resource} message             Message
     * @param  {String} direction             Parsing to execute, blob || cid
     * @return {String}                       Parsed HTML
     */
    const parse = (message, direction) => {
        const testDiv = getBodyParser();
        testDiv.innerHTML = message.getDecryptedBody();
        Object
            .keys(CIDList[message.ID] || {})
            .forEach((cid, index) => {
                const current = Blobs[cid];
                const isContentLocation = (current) ? current.isContentLocation : false;
                const url = (current) ? current.url : '';
                const selector = (isContentLocation) ? `img[src="${cid}"]` : `img[src="cid:${cid}"], img[rel="${cid}"], img[data-embedded-img="cid:${cid}"]`;
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
    var xray = function(message) {
        var attachs =  message.Attachments || [];
        message.NumEmbedded = 0;

        /* initiate a CID list */
        const MAP = CIDList[message.ID] = {};

        // Check if we have attachments
        if (attachs.length) {
                // Build a list of cids
                attachs.forEach(({ Headers = {}, Name = '', MIMEType = '' }) => {
                    const disposition = Headers['content-disposition'];

                    // BE require an inline content-disposition!
                    if (disposition && REGEXP_IS_INLINE.test(disposition) && MIMETypeSupported.indexOf(MIMEType) !== -1) {
                        let cid;

                        if (Headers['content-id']) {
                            // remove the < >.
                            // e.g content-id: "<ii_io4oiedu2_154a668c35c08c
                            cid = Headers['content-id'].replace(REGEXP_CID_CLEAN, '');
                        } else if (Headers['content-location']) {
                            // We can find an image without cid so base64 the location
                            cid = Headers['content-location'];
                        }

                        Headers.embedded = 1;
                        counterState.add(message);
                        MAP[cid] = { Headers, Name };
                    }
                });
            return true;
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
        const { Headers = {}} = Attachments[cid] || {};
        const key = getHashKey(message);
        MAP_BLOBS[key] = MAP_BLOBS[key] || [];
        return (data, MIME) => {
            // Turn the decrypted attachment data into a blob.
            let blob = new Blob([data], {type: MIME});
            // Generate the URL
            let imageUrl = urlCreator().createObjectURL(blob);
            // Store the generated URL
            Blobs[ cid ] = { url:imageUrl, isContentLocation: typeof Headers['content-location'] !== 'undefined' && typeof Headers['content-id'] === 'undefined' };
            // this is supposed to remove the blob so it
            // can be garbage collected. we dont save it (for now)
            blob = null, imageUrl = null;
            MAP_BLOBS[key].push(cid);
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
    const findInlineAttachements = ({ ID, Attachments = [] } = {}) => {
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
                        } else {
                            return Headers['content-id'] === contentId;
                        }
                    })[0];

                attachment && acc.push({ cid, attachment});
                return acc;
            }, []);
    };


    /**
     * Decrypt the attachment that has been detected within
     * a CID header, and store them for reusability purpose
     * @param {Resource} message
     */
    const decrypt = function(message) {
        var deferred = $q.defer();
        var processed = false;

        const list = findInlineAttachements(message);

        const user = authentication.user || { ShowEmbedded: 0 };
        const show = message.showEmbedded === true || user.ShowEmbedded === 1;

        let parsingAttachementPromise = [];

        // loop the CID list
        list
            .forEach( function({ cid, attachment }) {
            // Check if the CID is already stored
            if (!Blobs[cid] && show) {
                processed = true;

                var att, pk;

                attachment.decrypting = true;
                // decode key packets
                var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));
                // get user's pk
                if ($state.is('eo.message') || $state.is('eo.reply')) {
                    var decrypted_token = secureSessionStorage.getItem('proton:decrypted_token');
                    var token_id = $stateParams.tag;

                    pk = pmcw.decode_utf8_base64(secureSessionStorage.getItem('proton:encrypted_password'));
                    att = Eo.attachment(decrypted_token, token_id, attachment.ID);
                } else {
                    pk = authentication.getPrivateKeys(message.AddressID);
                    att = attachments.get(attachment.ID, attachment.Name);
                }

                var key = pmcw.decryptSessionKey(keyPackets, pk);

                // when we have the session key and attachment:
                const promiseParsing = $q.all({ attObject: att, key })
                    .then(({ attObject = {}, key = {} } = {} ) => {
                        // create new Uint8Array to store decryted attachment
                        let at = new Uint8Array(attObject.data);
                        // decrypt the att
                        return pmcw
                            .decryptMessage(at, key.key, true, key.algo)
                            .then(({ data } = {}) => {
                                attachment.decrypting = false;
                                at = null;
                                const storeAttachement = store(message, cid);
                                storeAttachement(data, attachment.MIMEType);
                                // Store attachment decrypted
                                attachments.push({
                                    ID: attachment.ID,
                                    data: data,
                                    name: attachment.Name
                                });
                            })
                            .catch(deferred.reject);
                    }).catch(deferred.reject);

                parsingAttachementPromise.push(promiseParsing);
            }
        });

        const promiseList = $q.all(parsingAttachementPromise)
            .then(() => {
                const computed =  list
                    .reduce((acc, key) => (acc[key] = Blobs[key], acc), Object.create(null));
                deferred.resolve(computed);
            })
            .catch((err) => console.error(err));

        networkActivityTracker.track(promiseList);

       if (!processed) {
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
            .filter(k => k !== key && k.indexOf(PREFIX_DRAFT) !== 0) // Do nothing for draft and itself
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

    var embedded = {
        MIMETypeSupported,
        parser(message, direction = 'blob') {
            CIDList = {};

            var deferred = $q.defer(), content = message.getDecryptedBody();

            if (xray(message)) {
                // Check if the content has cid attachments
                if (Object.keys(CIDList).length > 0) {
                    // Decrypt, then return the parsed content
                    decrypt(message)
                    .then(() => parse(message, direction))
                    .then((content) => {
                        deferred.resolve(content);
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
        getCid: function(headers) {
            return headers && (headers['content-id'].replace(REGEXP_CID_CLEAN, '') || headers['content-location']);
        },
        getBlob: function(cid) {
            var xhr = new XMLHttpRequest();
            var deferred = $q.defer();

            xhr.open('GET', Blobs[cid].url, true);
            xhr.responseType = 'blob';
            xhr.onload = function(e) {
                if (this.status === 200) {
                    deferred.resolve(this.response);
                }
            };

            xhr.send();

            return deferred.promise;
        },
        addEmbedded: function(message, cid, data, MIME){
            store(message, cid)(data, MIME);
            message.editor.insertImage(Blobs[ cid ].url, {rel:cid, class:'proton-embedded'});
        },
        removeEmbedded: function(message,Headers){

            const disposition = Headers['content-disposition'];
            if(Headers['content-disposition'] && REGEXP_IS_INLINE.test(disposition)) {

                if (Headers['content-id']) {
                    // remove the < >.
                    // e.g content-id: "<ii_io4oiedu2_154a668c35c08c
                    cid = Headers['content-id'].replace(REGEXP_CID_CLEAN,'');
                } else if (Headers['content-location']) {
                    // We can find an image without cid so base64 the location
                    cid = Headers['content-location'];
                }

                var tempDOM = angular.element('<div>').append(message.getDecryptedBody());
                var nodes = tempDOM.find('img[data-embedded-img="cid:'+cid+'"], img[rel="'+cid+'"]');
                if(nodes.length > 0) {
                    nodes.remove();
                }

                counterState.remove(message);
                message.setDecryptedBody(tempDOM.html());
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
            const cid = attribute.replace('cid:', '');
            const { url = '' } = Blobs[cid] || {};
            return url;
        },

        /**
         * Check if attachment exist
         * @param  {src} cid:url
         * @return {attach}
         */
        getAttachment(message, src) {
            if (xray(message) && CIDList[message.ID]) {
                return (CIDList[message.ID][src.replace(REGEXP_CID_START, "")]) || {};
            }
            return {};
        }


    };

    return embedded;

});
