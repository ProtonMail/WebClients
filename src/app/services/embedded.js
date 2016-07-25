angular.module("proton.embedded", [])
.factory("embedded", function(
    $log,
    $q,
    authentication,
    pmcw,
    attachments,
    notify
) {

    // Loop through attachments and create an array of
    // CIDs for any embedded image attachments
    var Blobs = [];

    let CIDList = {};

    const REGEXP_IS_INLINE = /^inline/i;
    const REGEXP_CID_CLEAN = /[<>]+/g;
    const EMBEDDED_CLASSNAME = 'proton-embedded';
    const DIV = document.createElement('DIV');

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
             * Don't set the src attrite since its evaluated and cid:cid create an error
             * @{link https://github.com/ProtonMail/Angular/issues/3330}
             */
            _(nodes)
                .each((node) => {
                    node.removeAttribute('src');

                    // Used later with a regexp
                    node.setAttribute('data-src', `cid:${cid}`);
                });
        }
    };

    /**
     * Parse the content to inject the generated blob src
     * because the blob live inside the browser we may
     * set an extra rel attribute so we can update the blob src later
     * @param  {String} this.DecryptedBody From Message
     * @param  {String} this.Body          From Message
     * @param  {Array} CIDList        From Message
     * @param  {String} direction             Parsing to execute, blob || cid
     * @return {String}                       Parsed HTML
     */
    const parse = function (direction) {

        const testDiv = getBodyParser();
        testDiv.innerHTML = this.DecryptedBody || this.Body;
        Object
            .keys(CIDList)
            .forEach((cid, index) => {
                const current = Blobs[ cid ];
                const selector = (current.isContentLocation) ? `img[src="${cid}"]` : `img[src="cid:${cid}"], img[rel="${cid}"]`;

                const nodes = [].slice.call(testDiv.querySelectorAll(selector));

                if (nodes.length) {
                    (actionDirection[direction] || angular.noop)(nodes, cid, current.url);
                }
            });

        // Prevent error => https://github.com/ProtonMail/Angular/issues/3330
        return testDiv.innerHTML.replace(/data-src/g, 'src');
    };

    /**
     * @return {Boolean}
     */
    var xray = function() {
        var self = this;
        var attachs =  self.Attachments || [];

        /* initiate a CID list */
        CIDList = {};

        // Check if we have attachments
        if (attachs.length) {

            // Build a list of cids
            attachs.forEach(({ Headers = {} }) => {
                const disposition = Headers['content-disposition'];

                // BE require an inline content-disposition!
                if (disposition && REGEXP_IS_INLINE.test(disposition)) {
                    let cid;

                    if (Headers['content-id']) {
                        // remove the < >.
                        // e.g content-id: "<ii_io4oiedu2_154a668c35c08c
                        cid = Headers['content-id'].replace(REGEXP_CID_CLEAN,'');
                    }

                    // We can find an image without cid so base64 the location
                    if (Headers['content-location'] && !Headers['content-id']) {
                        cid = Headers['content-location'];
                    }

                    CIDList[cid] = { Headers };
                }
            });

            return true;
        } else {
            return false;
        }
    };

    // Use the Blobs array to store CIDs url reference
    // once the attachment has been decrypted
    // so we can re-use the blob instead of decrypting
    // this should be rewritted a bit to work with
    // the service store

    const store = (cid, data, MIME, CIDList = {}, decryption = Promise) =>{

        const { Headers = {}} = CIDList[cid] || {};

        if (Headers['content-location'] && !Headers['content-id']) {
            Blobs[ cid ] = {
                isContentLocation: true,
                url: cid
            };
        } else {
            // Turn the decrypted attachment data into a blob.
            let blob = new Blob([data], {type: MIME});
            // Generate the URL
            let urlCreator = window.URL || window.webkitURL;
            let imageUrl = urlCreator.createObjectURL( blob );
            // Store the generated URL
            Blobs[ cid ] = {url:imageUrl};


           // this is supposed to remove the blob so it
           // can be garbage collected. we dont save it (for now)
           blob, urlCreator, imageUrl = null;
        }

        // check if all CID are stored so we can resolve
        if(Object.keys(Blobs).length === Object.keys(CIDList).length){
            decryption.resolve(Blobs);
        }
    };


    // Decrypt the attachment that has been detected within
    // a CID header, and store them for reusability purpose

    var decrypt = function() {

        var self = this;
        var decryption = $q.defer();
        var attachs =  self.Attachments;
        var processed = false;

        // loop the CID list
        Object
            .keys(CIDList)
            .forEach( function(cid, index) {

            // Check if the CID is already stored
            if(!Blobs[ cid ]) {

                processed = true;

                var attachment = attachs[index];
                var att = attachments.get(attachment.ID, attachment.Name);
                var message = self.message;

                attachment.decrypting = true;

                // decode key packets
                var keyPackets = pmcw.binaryStringToArray(pmcw.decode_base64(attachment.KeyPackets));

                // get user's pk
                var pk = authentication.getPrivateKeys(self.AddressID);
                var key = pmcw.decryptSessionKey(keyPackets, pk);

                // when we have the session key and attachment:
                $q.all({
                    "attObject": att,
                    "key": key
                }).then(function(obj) {

                    // create new Uint8Array to store decryted attachment
                    var at = new Uint8Array(obj.attObject.data);

                    // grab the key
                    var key = obj.key.key;

                    // grab the algo
                    var algo = obj.key.algo;

                    // decrypt the att
                    pmcw.decryptMessage(at, key, true, algo)
                    .then(
                        function(decryptedAtt) {

                            // store to Blobs
                            store(cid,decryptedAtt.data,attachment.MIMEType, CIDList, decryption);
                            attachment.decrypting = false;
                        }
                    );

                });
            }

       });

       if(!processed) {
          // all cid was already stored, we can resolve
          decryption.resolve(Blobs);
       }

       return decryption.promise;

    };


    // blob URLs never get deallocated automatically--
    // we manage deallocation to avoid a massive memory leak
    // once we navigate away from a conversation
    // eg. this can be triggered from the conversations controller

    var deallocate = function() {

        var urlCreator = window.URL || window.webkitURL;

        for (var index in Blobs) {

            // The URL.revokeObjectURL() static method releases an existing object URL
            // which was previously created by calling URL.createObjectURL().
            // Call this method when you've finished using a object URL, in order to let
            // the browser know it doesn't need to keep the reference to the file any longer.

            URL.revokeObjectURL(Blobs[index].url);

            // Remove the Blob ref from our store
            delete Blobs[index];

        }
    };

    var embedded = {
        parser: function(message,direction) {

             // parse direction (cid<->blob)
            direction = direction || "blob";
            CIDList = {};
            var deferred = $q.defer(),
                content = message.decryptedBody|| message.Body,
                x = xray.bind(message),
                d = decrypt.bind(message),
                p = parse.bind(message, direction);

            if (x()) {
                // Check if the content has cid attachments
                if(Object.keys(CIDList).length > 0) {

                    // Decrypt, then return the parsed content
                    d().then(p).then(function(content){
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
        addEmbedded: function(message, cid, data, MIME){
            store(cid, data, MIME);
            message.editor.insertImage(Blobs[ cid ].url, {rel:cid, class:'proton-embedded'});
        },
        removeEmbedded: function(message,headers){

            if(headers['content-id'] !== undefined) {

                var cid = headers['content-id'].replace(/[<>]+/g,'');
                var tempDOM = angular.element('<div>').append(message.Body);
                var nodes = tempDOM.find('img[src="cid:'+cid+'"], img[rel="'+cid+'"]');

                if(nodes.length > 0) {
                    nodes.remove();
                }

                return tempDOM.html();

            }

            return message.Body;
        },
        deallocator: deallocate,

        /**
         * Get the url for an embedded image
         * @param  {Node} node Image
         * @return {String}
         */
        getUrl(node) {
            const attribute = node.getAttribute('data-embedded-img') || '';
            const cid = attribute.split(':')[1];
            const { url = '' } = Blobs[cid] || {};
            return url;
        }

    };

    return embedded;

});
