import React, { useRef, useState, useEffect, forwardRef, Ref } from 'react';

import { SquireType, getSquireRef, setSquireRef, initSquire } from '../../../helpers/squire/squireConfig';
import { useHandler } from '../../../hooks/useHandler';
import { pasteFileHandler } from '../../../helpers/squire/squireActions';

interface Props {
    onReady: () => void;
    onFocus: () => void;
    onInput: (value: string) => void;
    onAddEmbeddedImages: (files: File[]) => void;
}

/**
 * This component is *Uncontrolled*
 * https://reactjs.org/docs/uncontrolled-components.html
 * There is issues when trying to synchronize input value to the current content of the editor
 * Uncontrolled components is prefered in this case
 */
const EditorSquire = forwardRef(({ onReady, onFocus, onInput, onAddEmbeddedImages }: Props, ref: Ref<SquireType>) => {
    const [iframeReady, setIframeReady] = useState(false);
    const [squireReady, setSquireReady] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        const handleLoad = () => setIframeReady(true);

        const iframeDoc =
            (iframeRef.current?.contentDocument || iframeRef.current?.contentWindow) &&
            iframeRef.current?.contentWindow?.document;

        if (iframeDoc && iframeDoc.readyState === 'complete') {
            handleLoad();
        }

        iframeRef.current?.addEventListener('load', handleLoad);
        return () => iframeRef.current?.removeEventListener('load', handleLoad);
    }, []);

    useEffect(() => {
        if (iframeReady && !squireReady) {
            const iframeDoc = iframeRef.current?.contentWindow?.document as Document;
            const squire = initSquire(iframeDoc);
            setSquireRef(ref, squire);
            setSquireReady(true);
            onReady();
        }
    }, [iframeReady]);

    const handleFocus = useHandler(onFocus);
    const handleInput = useHandler(() => onInput(getSquireRef(ref).getHTML()));
    const handlePaste = useHandler(pasteFileHandler(onAddEmbeddedImages));

    useEffect(() => {
        if (squireReady) {
            const squire = getSquireRef(ref);

            squire.addEventListener('focus', handleFocus);
            squire.addEventListener('input', handleInput);
            squire.addEventListener('paste', handlePaste);
            return () => {
                squire.removeEventListener('focus', handleFocus);
                squire.removeEventListener('input', handleInput);
                squire.removeEventListener('paste', handlePaste);
            };
        }
    }, [squireReady]);

    return (
        <div className="editor-squire-wrapper fill w100 scroll-if-needed flex-item-fluid rounded">
            <iframe ref={iframeRef} frameBorder="0" className="w100 h100 squireIframe"></iframe>
        </div>
    );
});

export default EditorSquire;
