import React, { useRef, useState, useEffect, forwardRef, Ref } from 'react';

import { SquireType, getSquireRef, setSquireRef, initSquire } from '../../../helpers/squire/squireConfig';
import { useHandler } from '../../../hooks/useHandler';
import { pasteFileHandler } from '../../../helpers/squire/squireActions';
import { findCIDsInContent } from '../../../helpers/embedded/embeddedFinder';
import { diff } from 'proton-shared/lib/helpers/array';
import { Attachment } from '../../../models/attachment';
import { MessageExtended } from '../../../models/message';

interface Props {
    message: MessageExtended;
    onReady: () => void;
    onFocus: () => void;
    onInput: (value: string) => void;
    onAddEmbeddedImages: (files: File[]) => void;
    onRemoveAttachment: (attachment: Attachment) => () => void;
}

/**
 * This component is *Uncontrolled*
 * https://reactjs.org/docs/uncontrolled-components.html
 * There is issues when trying to synchronize input value to the current content of the editor
 * Uncontrolled components is prefered in this case
 */
const EditorSquire = forwardRef(
    ({ message, onReady, onFocus, onInput, onAddEmbeddedImages, onRemoveAttachment }: Props, ref: Ref<SquireType>) => {
        const [iframeReady, setIframeReady] = useState(false);
        const [squireReady, setSquireReady] = useState(false);

        // Keep track of the containing CIDs to detect deletion
        const [cids, setCIDs] = useState<string[]>([]);

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

        // Angular/src/app/squire/services/removeInlineWatcher.js
        const checkImageDeletion = useHandler(
            () => {
                const newCIDs = findCIDsInContent(getSquireRef(ref).getHTML());
                const removedCIDs = diff(cids, newCIDs);
                removedCIDs.forEach((cid) => {
                    const info = message.embeddeds?.get(cid);
                    if (info) {
                        onRemoveAttachment(info.attachment)();
                    }
                });
                setCIDs(newCIDs);
            },
            { debounce: 500 }
        );

        const handleFocus = useHandler(onFocus);
        const handleInput = useHandler(() => {
            checkImageDeletion();
            onInput(getSquireRef(ref).getHTML());
        });
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
    }
);

export default EditorSquire;
