import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

import { MESSAGE_IFRAME_BLOCKQUOTE_ID, MESSAGE_IFRAME_TOGGLE_ID } from '@proton/mail-renderer/constants';

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
    const showToggle = initStatus !== 'start' && !!iframeToggleDiv && showBlockquoteToggle;

    useEffect(() => {
        const iframeBlockquoteDiv =
            iframeRef.current?.contentWindow?.document.getElementById(MESSAGE_IFRAME_BLOCKQUOTE_ID);
        if (!iframeBlockquoteDiv) {
            return;
        }

        if (showBlockquote) {
            iframeBlockquoteDiv.innerHTML = blockquoteContent;
        } else {
            iframeBlockquoteDiv.innerHTML = '';
        }

        // If the user clicks the show blockquote button, we want to set the showBlockquotesProp state
        // But this useEffect can be triggered by the shortcut, where we don't want to trigger the OnBlockquoteToggle
        if (showBlockquote !== showBlockquoteProp) {
            onBlockquoteToggle?.();
        }
    }, [showBlockquote]);

    useEffect(() => {
        // If the user triggers the showBlockquoteProp with a shortcut, we want to update showBlockquote
        if (showBlockquote !== showBlockquoteProp) {
            setShowBlockquote(showBlockquoteProp);
        }
    }, [showBlockquoteProp]);

    return {
        iframeToggleDiv,
        showToggle,
        showBlockquote,
        setShowBlockquote,
    };
};

export default useIframeShowBlockquote;
