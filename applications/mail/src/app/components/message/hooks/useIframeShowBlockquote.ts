import { RefObject, useEffect, useState } from 'react';
import { MESSAGE_IFRAME_BLOCKQUOTE_ID, MESSAGE_IFRAME_TOGGLE_ID } from '../constants';
interface Props {
    iframeRef: RefObject<HTMLIFrameElement>;
    initStatus: 'start' | 'base_content' | 'done';
    showBlockquoteProp: boolean;
    showBlockquoteToggle: boolean;
    blockquoteContent: string;
    onBlockquoteToggle?: () => void;
}

const useIframeShowBlockquote = ({
    blockquoteContent,
    iframeRef,
    initStatus,
    showBlockquoteProp,
    showBlockquoteToggle,
    onBlockquoteToggle,
}: Props) => {
    const [showBlockquote, setShowBlockquote] = useState(showBlockquoteProp);

    const iframeToggleDiv = iframeRef.current?.contentWindow?.document.getElementById(MESSAGE_IFRAME_TOGGLE_ID);
    const showToggle = initStatus !== 'start' && !!iframeToggleDiv && showBlockquoteToggle === true;

    useEffect(() => {
        const iframeBlockquoteDiv =
            iframeRef.current?.contentWindow?.document.getElementById(MESSAGE_IFRAME_BLOCKQUOTE_ID);
        if (!iframeBlockquoteDiv) {
            return;
        }

        if (showBlockquote === true) {
            iframeBlockquoteDiv.innerHTML = blockquoteContent;
        } else {
            iframeBlockquoteDiv.innerHTML = '';
        }

        onBlockquoteToggle?.();
    }, [showBlockquote]);

    return {
        iframeToggleDiv,
        showToggle,
        showBlockquote,
        setShowBlockquote,
    };
};

export default useIframeShowBlockquote;
