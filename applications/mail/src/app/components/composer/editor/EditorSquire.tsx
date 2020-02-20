import React, { useRef, useState, useEffect, forwardRef, Ref } from 'react';
import Squire from 'squire-rte';

import {
    insertCustomStyle,
    SQUIRE_CONFIG,
    SquireType,
    getSquireRef,
    setSquireRef
} from '../../../helpers/squire/squireConfig';

interface Props {
    onReady: () => void;
    onFocus: () => void;
    onInput: (value: string) => void;
}

/**
 * This component is *Uncontrolled*
 * https://reactjs.org/docs/uncontrolled-components.html
 * There is issues when trying to synchronize input value to the current content of the editor
 * Uncontrolled components is prefered in this case
 */
const EditorSquire = forwardRef(({ onReady, onFocus, onInput }: Props, ref: Ref<SquireType>) => {
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
            insertCustomStyle(iframeDoc);
            const squire = new Squire(iframeDoc, SQUIRE_CONFIG);
            setSquireRef(ref, squire);
            setSquireReady(true);
            onReady();
        }
    }, [iframeReady]);

    useEffect(() => {
        if (squireReady) {
            const squire = getSquireRef(ref);

            const handleInput = () => {
                onInput(squire.getHTML());
            };

            squire.addEventListener('focus', onFocus);
            squire.addEventListener('input', handleInput);
            return () => {
                squire.removeEventListener('focus', onFocus);
                squire.removeEventListener('input', handleInput);
            };
        }
    }, [squireReady, onInput, onFocus]);

    return (
        <div className="editor-squire-wrapper fill w100 scroll-if-needed flex-item-fluid rounded">
            <iframe ref={iframeRef} frameBorder="0" className="w100 h100 squireIframe"></iframe>
        </div>
    );
});

export default EditorSquire;
