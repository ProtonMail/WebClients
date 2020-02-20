import React, { MutableRefObject, useRef, useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import Quill, { DeltaStatic } from 'quill';
import Delta from 'quill-delta';

import { generateUID } from 'react-components';
import { noop } from 'proton-shared/lib/helpers/function';

import EditorToolbar from './EditorToolbar';
import { EmbeddedMap } from '../../../models/message';

import '../../../helpers/quill/quillSetup';

import 'react-quill/dist/quill.snow.css';

export type InsertRef = MutableRefObject<((embeddeds: EmbeddedMap) => void) | undefined>;

// Strangely types from quill and quill-delta are incompatible
const convertDelta = (delta: Delta): DeltaStatic => (delta as any) as DeltaStatic;

interface Props {
    document?: Element;
    onChange: (content: string) => void;
    onFocus: () => void;
    onAddAttachments: (files: File[]) => void;
    contentFocusRef: MutableRefObject<() => void>;
    contentInsertRef: InsertRef;
}

const Editor = ({ document, onChange, onFocus, onAddAttachments, contentFocusRef, contentInsertRef }: Props) => {
    const [uid] = useState(generateUID('quill'));
    const [content, setContent] = useState('');
    const reactQuillRef = useRef<ReactQuill>(null);

    const toolbarId = `quill-${uid}-toolbar`;
    const getQuill = () => reactQuillRef.current?.getEditor() as Quill;

    useEffect(() => {
        contentFocusRef.current = reactQuillRef.current?.focus || noop;
    }, []);

    useEffect(() => {
        // Only force Quill content at startup
        // Server can never modify editor content after that
        if (!content && document?.innerHTML) {
            setContent(document?.innerHTML);
        }
    }, [document?.innerHTML]);

    const getSelection = () => {
        const quill = getQuill();
        const { index, length } = quill.getSelection(true);
        return quill.getText(index, length);
    };

    const handleChange = (content: string, delta: any, source: string) => {
        setContent(content);
        if (source === 'user') {
            onChange(content);
        }
    };

    const handleAddLink = (url: string, label: string) => {
        const quill = getQuill();
        const range = quill.getSelection(true);

        const delta = new Delta()
            .retain(range.index)
            .delete(range.length)
            .insert(label, { link: url });

        quill.updateContents(convertDelta(delta), 'user');
    };

    const handleAddImageUrl = (url: string) => {
        const quill = getQuill();
        const range = quill.getSelection(true);

        const delta = new Delta()
            .retain(range.index)
            .delete(range.length)
            .insert({ image: url });

        quill.updateContents(convertDelta(delta), 'user');
        quill.setSelection(range.index + 1, 0, 'silent');
    };

    const handleInsertEmbedded = async (embeddeds: EmbeddedMap) => {
        const quill = getQuill();
        const range = quill.getSelection(true);

        const delta = new Delta().retain(range.index).delete(range.length);

        embeddeds.forEach((info, cid) => {
            delta.insert({ image: info.url }, { cid, alt: info.attachment.Name });
        });

        quill.updateContents(convertDelta(delta), 'user');
        quill.setSelection(range.index + 1, 0, 'silent');
    };

    useEffect(() => {
        contentInsertRef.current = handleInsertEmbedded;
    }, []);

    return (
        <>
            <EditorToolbar
                id={toolbarId}
                getSelection={getSelection}
                onAddLink={handleAddLink}
                onAddImageUrl={handleAddImageUrl}
                onAddAttachments={onAddAttachments}
            />
            <ReactQuill
                className="composer-quill w100 flex-item-fluid"
                modules={{ toolbar: `#${toolbarId}` }}
                value={content}
                readOnly={!content}
                onChange={handleChange}
                onFocus={onFocus}
                ref={reactQuillRef}
            />
        </>
    );
};

export default Editor;
