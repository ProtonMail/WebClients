angular.module('proton.squire')
    .factory('removeInlineWatcher', (editorModel, $rootScope) => {

        const getAttachmentIDs = (input, message, { dispatch, latest }) => {
            // Extract CID per embedded image
            const ids = (input.match(/(rel=("([^"]|"")*"))|(data-attachment-id=("([^"]|"")*"))/g) || [])
                .map((value) => value.split(/rel="|data-attachment-id="/)[1].slice(0, -1));

            const diff = _.difference(latest.ID, ids);
            // If we add or remove an embedded image, the diff is true
            if (diff.length) {
                // Find attachements not in da input
                const list = message
                    .Attachments
                    .filter(({ ID }) => {
                        if (ID) {
                            return _.contains(diff, ID);
                        }
                        return false;
                    });

                dispatch({ message, list });

            }
            latest.ID = ids;
        };

        const getCIDs = (input, message, { latest, dispatch }) => {
            // Extract CID per embedded image
            const cids = (input.match(/(rel=("([^"]|"")*"))|(data-embedded-img=("([^"]|"")*"))/g) || [])
                .map((value) => value.split(/rel="|data-embedded-img="/)[1].slice(0, -1));
            // If we add or remove an embedded image, the diff is true
            if (cids.length < latest.CID.length) {
                // Find attachements not in da input
                const list = message
                    .Attachments
                    .filter(({ uploading, Headers = {} }) => {

                        // If the file is uploading it means: its first time
                        if (uploading) {
                            return false;
                        }

                        const cid = Headers['content-id'];
                        if (cid) {
                            return cids.indexOf(cid.replace(/[<>]+/g, '')) === -1;
                        }

                        return false;

                    });

                dispatch({ message, list });

            }
            latest.CID = cids;
        };

       /**
        * Watcher onInput to find and remove attachements if we remove an embedded
        * image from the input
        * @return {Function} Taking message as param
        */
        function removerEmbeddedWatcher(action) {
            const latest = { CID: [], ID: [] };
            const key = ['attachment.upload', action].filter(Boolean).join('.');
            const dispatch = (data) => $rootScope.$emit(key, { type: 'remove.all', data });

            return (message, editor) => {
                const input = editor.getHTML() || '';

                getAttachmentIDs(input, message, { dispatch, latest });
                getCIDs(input, message, { dispatch, latest });

            };
        }

        return removerEmbeddedWatcher;

    });
