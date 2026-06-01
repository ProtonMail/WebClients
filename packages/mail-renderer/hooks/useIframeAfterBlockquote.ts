import type { RefObject } from 'react';
import { useEffect } from 'react';

import { MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID } from '../constants';

interface Props {
    iframeRef: RefObject<HTMLIFrameElement>;
    initStatus: 'start' | 'base_content' | 'done';
    afterBlockquoteContent: string;
}

/**
 * Fills the `proton-after-blockquote` iframe slot with content that should always be
 * visible at the bottom of the message — typically trailing footers (e.g. AVG "Sans
 * virus" antivirus signatures) that sat after the quoted message in the source HTML.
 */
const useIframeAfterBlockquote = ({ iframeRef, initStatus, afterBlockquoteContent }: Props) => {
    useEffect(() => {
        if (initStatus === 'start') {
            return;
        }
        const iframeAfterBlockquoteDiv = iframeRef.current?.contentWindow?.document.getElementById(
            MESSAGE_IFRAME_AFTER_BLOCKQUOTE_ID
        );
        if (!iframeAfterBlockquoteDiv) {
            return;
        }
        iframeAfterBlockquoteDiv.innerHTML = afterBlockquoteContent;
    }, [initStatus, afterBlockquoteContent]);
};

export default useIframeAfterBlockquote;
