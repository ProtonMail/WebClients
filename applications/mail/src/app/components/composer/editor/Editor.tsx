import React, { MutableRefObject, useRef, useEffect, useState } from 'react';

import EditorToolbar from './EditorToolbar';
import { EmbeddedMap } from '../../../models/message';
import EditorSquire from './EditorSquire';
import { SquireType } from '../../../helpers/squire/squireConfig';
import { locateBlockquote } from '../../../helpers/message/messageBlockquote';
import { Button } from 'react-components';
import { insertImage } from '../../../helpers/squire/squireActions';

export type InsertRef = MutableRefObject<((embeddeds: EmbeddedMap) => void) | undefined>;

interface Props {
    document?: Element;
    onChange: (content: string) => void;
    onFocus: () => void;
    onAddAttachments: (files: File[]) => void;
    contentFocusRef: MutableRefObject<() => void>;
    contentInsertRef: InsertRef;
}

const Editor = ({ document, onChange, onFocus, onAddAttachments, contentFocusRef, contentInsertRef }: Props) => {
    const [editorReady, setEditorReady] = useState(false);
    const [documentReady, setDocumentReady] = useState(false);
    const [focusWhenReady, setFocusWhenReady] = useState(false);
    const [blockquoteExpanded, setBlockquoteExpanded] = useState(true);
    const [blockquoteSaved, setBlockquoteSaved] = useState('');

    const squireRef = useRef<SquireType>(null) as MutableRefObject<SquireType>;

    useEffect(() => {
        contentFocusRef.current = () => setFocusWhenReady(true);
    }, []);

    useEffect(() => {
        if (document?.innerHTML) {
            setDocumentReady(true);
        }
    }, [document?.innerHTML]);

    // Initialize Squire content at (and only) startup
    useEffect(() => {
        if (editorReady && documentReady) {
            const [content, blockquote] = locateBlockquote(document);
            setBlockquoteSaved(blockquote);
            setBlockquoteExpanded(blockquote === '');
            squireRef.current?.setHTML(content);
            contentFocusRef.current = squireRef.current?.focus;
            if (focusWhenReady) {
                squireRef.current?.focus();
            }
        }
    }, [editorReady, documentReady]);

    const handleReady = () => {
        setEditorReady(true);
    };

    const handleInput = (content: string) => {
        if (!blockquoteExpanded) {
            onChange(content + blockquoteSaved);
        } else {
            onChange(content);
        }
    };

    const handleShowBlockquote = () => {
        setBlockquoteExpanded(true);
        const content = squireRef.current.getHTML();
        squireRef.current.setHTML(content + blockquoteSaved);
    };

    const handleInsertEmbedded = async (embeddeds: EmbeddedMap) => {
        embeddeds.forEach((info, cid) => {
            insertImage(squireRef.current, info.url || '', { 'data-embedded-img': cid, alt: info.attachment.Name });
        });
    };

    useEffect(() => {
        contentInsertRef.current = handleInsertEmbedded;
    }, []);

    return (
        <div className="editor w100 h100 rounded flex flex-column">
            <EditorToolbar squireRef={squireRef} editorReady={editorReady} onAddAttachments={onAddAttachments} />
            <EditorSquire ref={squireRef} onFocus={onFocus} onReady={handleReady} onInput={handleInput} />
            {!blockquoteExpanded && (
                <div className="m0-5">
                    <Button className="pm-button--small" onClick={handleShowBlockquote}>
                        ...
                    </Button>
                </div>
            )}
        </div>
    );
};

export default Editor;
