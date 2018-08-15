/* @ngInject */
function removeInlineWatcher(dispatchers) {
    const getCIDs = (input, message, { latest, dispatch }) => {
        // Extract CID per embedded image (with compat mode for old embedded)
        const cids = (input.match(/(rel=("([^"]|"")*"))|(data-embedded-img=("([^"]|"")*"))/g) || [])
            .filter((key) => key !== 'rel="noreferrer nofollow noopener"') // we don't care about links
            .map((key) => key.replace(/rel="|data-embedded-img="/, ''))
            .map((key) => key.slice(0, -1));

        // If we add or remove an embedded image, the diff is true
        if (cids.length < latest.CID.length) {
            // Find attachements not in da input
            const list = message.Attachments.filter(({ uploading, Headers = {} }) => {
                // If the file is uploading it means: its first time
                if (uploading) {
                    return false;
                }

                const cid = `${Headers['content-id'] || ''}`;
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
        const latest = { CID: [] };
        const key = ['attachment.upload', action].filter(Boolean).join('.');
        const { dispatcher } = dispatchers([key]);
        const dispatch = (data) => dispatcher[key]('remove.all', data);

        return (message, editor) => {
            const input = editor.getHTML() || '';
            getCIDs(input, message, { dispatch, latest });
        };
    }

    return removerEmbeddedWatcher;
}
export default removeInlineWatcher;
