import { Attachment } from 'proton-shared/lib/interfaces/mail/Message';
import { isPlainText as testIsPlainText } from 'proton-shared/lib/mail/messages';
import React, { MutableRefObject, useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { c } from 'ttag';
import { SquireEditor, useHandler, useMailSettings, useAddresses } from 'react-components';
import { SquireEditorMetadata } from 'react-components/components/editor/interface';
import { SquireEditorRef } from 'react-components/components/editor/SquireEditor';
import { RIGHT_TO_LEFT, MIME_TYPES } from 'proton-shared/lib/constants';
import { diff } from 'proton-shared/lib/helpers/array';
import { noop } from 'proton-shared/lib/helpers/function';

import { MessageExtended, EmbeddedMap } from '../../../models/message';
import { Breakpoints } from '../../../models/utils';
import { MessageChange } from '../Composer';
import {
    getContent,
    exportPlainText,
    plainTextToHTML,
    setDocumentContent,
} from '../../../helpers/message/messageContent';
import { locateBlockquote } from '../../../helpers/message/messageBlockquote';
import { removeEmbeddedHTML } from '../../../helpers/embedded/embeddedParser';
import { createEmbeddedMap } from '../../../helpers/embedded/embeddeds';
import EditorToolbarExtension from './EditorToolbarExtension';
import { findCIDsInContent } from '../../../helpers/embedded/embeddedFinder';

interface ExternalEditorActions {
    getContent: () => string;
    setContent: (message: MessageExtended) => void;
    insertEmbedded: (embeddeds: EmbeddedMap) => void;
    removeEmbedded: (attachments: Attachment[]) => void;
}

export type EditorActionsRef = MutableRefObject<ExternalEditorActions | undefined>;

interface Props {
    message: MessageExtended;
    disabled: boolean;
    breakpoints: Breakpoints;
    onReady: () => void;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshEditor?: boolean, silent?: boolean) => void;
    onChangeFlag: (changes: Map<number, boolean>) => void;
    onFocus: () => void;
    onAddAttachments: (files: File[]) => void;
    onRemoveAttachment: (attachment: Attachment) => Promise<void>;
    contentFocusRef: MutableRefObject<() => void>;
    editorActionsRef: EditorActionsRef;
    keydownHandler?: (e: KeyboardEvent) => void;
}

const SquireEditorWrapper = ({
    message,
    disabled,
    breakpoints,
    onReady,
    onChange,
    onChangeContent,
    onChangeFlag,
    onAddAttachments,
    onRemoveAttachment,
    onFocus,
    contentFocusRef,
    editorActionsRef,
    keydownHandler = noop,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const [addresses] = useAddresses();

    const [editorReady, setEditorReady] = useState(false);
    const [documentReady, setDocumentReady] = useState(false);
    const [blockquoteExpanded, setBlockquoteExpanded] = useState(true);
    const [blockquoteSaved, setBlockquoteSaved] = useState<string>();
    const skipNextInputRef = useRef(false); // Had trouble by using a state here

    // Keep track of the containing CIDs to detect deletion
    const [cids, setCIDs] = useState<string[]>([]);

    const squireEditorRef = useRef<SquireEditorRef>(null);

    const isPlainText = testIsPlainText(message.data);
    const rightToLeft = message.data?.RightToLeft ? RIGHT_TO_LEFT.ON : RIGHT_TO_LEFT.OFF;

    const metadata: SquireEditorMetadata = useMemo(
        () => ({
            supportPlainText: true,
            isPlainText,
            supportRightToLeft: true,
            rightToLeft,
            supportImages: true,
        }),
        [isPlainText, rightToLeft]
    );

    // Detect document ready
    useEffect(() => {
        if (isPlainText && message.plainText !== undefined) {
            setDocumentReady(true);
        }
        if (!isPlainText && message.document?.innerHTML) {
            setDocumentReady(true);
        }
    }, [isPlainText, message.plainText, message.document?.innerHTML]);

    const handleGetContent = useHandler(() => {
        const editorContent = squireEditorRef.current?.value || '';

        if (!blockquoteExpanded && blockquoteSaved !== '') {
            return editorContent + blockquoteSaved;
        }

        return editorContent;
    });

    const handleSetContent = (message: MessageExtended) => {
        let content;

        if (isPlainText) {
            content = getContent(message);
        } else {
            const [contentBeforeBlockquote, blockquote] = locateBlockquote(message.document);

            if (blockquoteSaved === undefined) {
                // Means it's the first content initialization
                content = contentBeforeBlockquote;
                setBlockquoteSaved(blockquote);
                setBlockquoteExpanded(blockquote === '');
            } else {
                content = blockquoteExpanded ? contentBeforeBlockquote + blockquote : contentBeforeBlockquote;
            }
        }

        skipNextInputRef.current = true;
        if (squireEditorRef.current) {
            squireEditorRef.current.value = content;
        }
    };

    // Initialize Squire (or textarea) content at (and only) startup
    useEffect(() => {
        if (isPlainText) {
            setEditorReady(false);
            onReady();
        }
        if (documentReady && (isPlainText || editorReady)) {
            handleSetContent(message);
            onReady();
            // This setTimeout is needed to have changes from handleSetContent reflected inside handleGetContent
            setTimeout(() => onChangeContent(handleGetContent(), false, true));
        }
    }, [editorReady, documentReady, isPlainText]);

    // Watch for image deletion
    // Angular/src/app/squire/services/removeInlineWatcher.js
    const checkImageDeletion = useHandler(
        () => {
            // Composer is being closed, too late for that check to run
            // Even if it's possible that we miss to remove an attachment in the last minute
            if (disabled) {
                return;
            }
            const newCIDs = findCIDsInContent(squireEditorRef.current?.value || '');
            const removedCIDs = diff(cids, newCIDs);
            removedCIDs.forEach((cid) => {
                const info = message.embeddeds?.get(cid);
                if (info) {
                    void onRemoveAttachment(info.attachment);
                }
            });
            setCIDs(newCIDs);
        },
        { debounce: 500 }
    );

    // Handle input considering blockquote
    const handleInput = useCallback(
        (content: string) => {
            if (!isPlainText) {
                // Squire (but not plaintext) trigger an input event when the initial content is inserted
                if (skipNextInputRef.current) {
                    skipNextInputRef.current = false;
                    return;
                }

                checkImageDeletion();
            }

            if (!blockquoteExpanded) {
                onChangeContent(content + blockquoteSaved);
            } else {
                onChangeContent(content);
            }
        },
        [onChangeContent, isPlainText, blockquoteExpanded]
    );

    const switchToPlainText = () => {
        const MIMEType = MIME_TYPES.PLAINTEXT;
        const plainText = exportPlainText(getContent(message));
        const embeddeds = createEmbeddedMap();
        onChange({ plainText, data: { MIMEType }, embeddeds });
    };
    const switchToHTML = () => {
        const MIMEType = MIME_TYPES.DEFAULT;
        const content = plainTextToHTML(message.data, message.plainText, mailSettings, addresses);
        const document = setDocumentContent(message.document, content);
        onChange({ document, data: { MIMEType } });
    };

    const handleChangeMetadata = useHandler((change: Partial<SquireEditorMetadata>) => {
        if (change.isPlainText !== undefined) {
            if (change.isPlainText) {
                switchToPlainText();
                setBlockquoteExpanded(true);
            } else {
                switchToHTML();
            }
        }
        if (change.rightToLeft !== undefined) {
            onChange({ data: { RightToLeft: change.rightToLeft } });
        }
    });

    // Editors actions ref to add and remove embedded image
    const handleInsertEmbedded = useHandler(async (embeddeds: EmbeddedMap) => {
        embeddeds.forEach((info, cid) => {
            squireEditorRef.current?.insertImage(info.url || '', {
                'data-embedded-img': cid,
                alt: info.attachment.Name,
            });
        });
    });
    const handleRemoveEmbedded = useHandler(async (attachments: Attachment[]) => {
        const document = squireEditorRef.current?.document;
        if (document) {
            attachments.forEach((attachment) => {
                removeEmbeddedHTML(document, attachment);
            });
        }
    });
    useEffect(() => {
        editorActionsRef.current = {
            getContent: handleGetContent,
            setContent: handleSetContent,
            insertEmbedded: handleInsertEmbedded,
            removeEmbedded: handleRemoveEmbedded,
        };
        contentFocusRef.current = () => {
            squireEditorRef.current?.focus();
        };
    }, [blockquoteExpanded, blockquoteSaved, isPlainText]);

    const handleEllipseClick = useHandler(() => {
        setBlockquoteExpanded(true);
        skipNextInputRef.current = true;
        if (squireEditorRef.current) {
            const content = squireEditorRef.current.value;
            squireEditorRef.current.value = content + blockquoteSaved;
        }
    });
    const handleSquireReady = useCallback(() => setEditorReady(true), []);

    return (
        <SquireEditor
            ref={squireEditorRef}
            placeholder={c('Placeholder').t`Write your message`}
            metadata={metadata}
            disabled={disabled}
            isNarrow={breakpoints.isNarrow}
            onChange={handleInput}
            onChangeMetadata={handleChangeMetadata}
            onFocus={onFocus}
            showEllipseButton={!blockquoteExpanded}
            onEllipseClick={handleEllipseClick}
            onReady={handleSquireReady}
            onAddImages={onAddAttachments}
            toolbarMoreDropdownExtension={<EditorToolbarExtension message={message.data} onChangeFlag={onChangeFlag} />}
            keydownHandler={keydownHandler}
        />
    );
};

export default memo(SquireEditorWrapper);
