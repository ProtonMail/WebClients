angular.module('proton.attachments')
    .factory('embeddedStore', ($rootScope) => {

        const Blobs = {};
        const MAP_BLOBS = {};
        let CIDList = {};

        const PREFIX_DRAFT = 'draft_';
        const urlCreator = () => window.URL || window.webkitURL;


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

        function getHashKey(msg) {
            const isDraft = msg.isDraft ? msg.isDraft() : false;
            const prefix = isDraft ? PREFIX_DRAFT : '';
            return `${prefix}${msg.ConversationID || msg.ID}`.trim();
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
            _.each(list, (cid) => {
                if (Blobs[cid]) {
                    urlCreator().revokeObjectURL(Blobs[cid].url);
                    // Remove the Blob ref from our store
                    delete Blobs[cid];
                }
            });
            delete MAP_BLOBS[key];
        }

        /**
         * blob URLs never get deallocated automatically--
         * we manage deallocation to avoid a massive memory leak
         * once we navigate away from a conversation
         * eg. this can be triggered from the conversations controller
         * @param  {Object} message [description]
         * @return {[type]}         [description]
         */
        function deallocate(message = {}) {
            const key = getHashKey(message);
            Object
                .keys(MAP_BLOBS)
                .filter((k) => k !== key && k.indexOf(PREFIX_DRAFT) !== 0) // Do nothing for draft and itself
                .forEach(deallocateList);
        }

        /**
         * Use the Blobs array to store CIDs url reference
         * once the attachment has been decrypted
         * so we can re-use the blob instead of decrypting
         * this should be rewritted a bit to work with
         * the service store
         */
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
                    Blobs[cid] = {
                        url: imageUrl,
                        isContentLocation: typeof Headers['content-location'] !== 'undefined' && typeof Headers['content-id'] === 'undefined'
                    };
                    // this is supposed to remove the blob so it
                    // can be garbage collected. we dont save it (for now)
                    blob = null;
                    imageUrl = null;

                    MAP_BLOBS[key].push(cid);
                }

            };
        };

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

        const getMessageCIDs = ({ ID }) => CIDList[ID] || {};
        const containsMessageCIDs = ({ ID }) => !!Object.keys(CIDList[ID] || {}).length;
        const addMessageCID = (message, { Headers = {}, Name = '' }) => {

            (!CIDList[message.ID]) && (CIDList[message.ID] = {});
            !message.NumEmbedded && (message.NumEmbedded = 0);

            const cid = readCID(Headers);
            Headers.embedded = 1;
            message.NumEmbedded++;
            CIDList[message.ID][cid] = { Headers, Name };
        };

        return {
            store,
            deallocate,
            cid: {
                init: () => (CIDList = {}),
                contains: containsMessageCIDs,
                add: addMessageCID,
                get: getMessageCIDs
            }
        };
    });
