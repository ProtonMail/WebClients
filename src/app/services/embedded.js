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
     * @param  {Array} this.CIDList        From Message
     * @param  {String} direction             Parsing to execute, blob || cid
     * @return {String}                       Parsed HTML
     */
    const parse = function (direction) {

        const testDiv = getBodyParser();
        testDiv.innerHTML = this.DecryptedBody || this.Body;

        this
            .CIDList
            .forEach((cid, index) => {
                const blobURL = Blobs[ cid ].url;
                const nodes = [].slice.call(testDiv.querySelectorAll(`img[src="cid:${cid}"], img[rel="${cid}"]`));

                if (nodes.length) {
                    (actionDirection[direction] || angular.noop)(nodes, cid, blobURL);
                }
            });

        // Prevent error => https://github.com/ProtonMail/Angular/issues/3330
        return testDiv.innerHTML.replace(/data-src/g, 'src');
    };

    var xray = function() {

        var self = this;
        var attachs =  self.Attachments;

        /* initiate a CID list */
        self.CIDList = [];

        // Check if we have attachments
        if(attachs && attachs.length > 0) {

            // Build a list of cids
            angular.forEach(attachs, function(value, key) {
                if(value.Headers['content-disposition'] !== undefined) {
                    var disposition = value.Headers["content-disposition"];
                    var inline = new RegExp('^inline', 'i');
                    // BE require an inline content-disposition!
                    if(inline.test(disposition)){
                        // remove the < >.
                        // e.g content-id: "<ii_io4oiedu2_154a668c35c08c81>"
                        if(value.Headers['content-id'] !== undefined) {
                            var cid = value.Headers['content-id'].replace(/[<>]+/g,'');
                            self.CIDList.push(cid);
                        }
                    }
                }
            });
        }

        return Promise.resolve();

    };

    // Use the Blobs array to store CIDs url reference
    // once the attachment has been decrypted
    // so we can re-use the blob instead of decrypting
    // this should be rewritted a bit to work with
    // the service store

    var store = function(cid, data, MIME, CIDList, decryption) {

        // Turn the decrypted attachment data into a blob.
        var blob = new Blob([data], {type: MIME});
        // Generate the URL
        var urlCreator = window.URL || window.webkitURL;
        var imageUrl = urlCreator.createObjectURL( blob );

        // Store the generated URL

        Blobs[ cid ] = {url:imageUrl};

        if(CIDList){
            // check if all CID are stored so we can resolve
            if(Object.keys(Blobs).length === CIDList.length){
                decryption.resolve(Blobs);
            }
        }

       // this is supposed to remove the blob so it
       // can be garbage collected. we dont save it (for now)
       blob, urlCreator, imageUrl = null;

    };


    // Decrypt the attachment that has been detected within
    // a CID header, and store them for reusability purpose

    var decrypt = function() {

        var self = this;
        var decryption = $q.defer();
        var attachs =  self.Attachments;
        var processed = false;

        // loop the CID list
        self.CIDList.forEach( function(cid, index) {

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
                            store(cid,decryptedAtt.data,attachment.MIMEType, self.CIDList, decryption);
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

            var deferred = $q.defer(),
                content = message.decryptedBody|| message.Body,
                x = xray.bind(message),
                d = decrypt.bind(message),
                p = parse.bind(message, direction);

            x().then(function(){
                // Check if the content has cid attachments
                if(message.CIDList.length > 0) {

                    // Decrypt, then return the parsed content
                    d().then(p).then(function(content){
                        deferred.resolve(content);
                    });

                } else {
                    // Resolve the decrypted body
                    deferred.resolve(content);
                }

            });


           return deferred.promise;

        },
        addEmbedded: function(message,cid,data,MIME){
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
        deallocator: deallocate

    };

    return embedded;

});