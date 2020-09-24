import React, { MutableRefObject, useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { c } from 'ttag';
import { SquireEditor, useHandler, useMailSettings, useAddresses } from 'react-components';
import { SquireEditorMetadata } from 'react-components/components/editor/interface';
import { SquireEditorRef } from 'react-components/components/editor/SquireEditor';
import { RIGHT_TO_LEFT, MIME_TYPES } from 'proton-shared/lib/constants';
import { diff } from 'proton-shared/lib/helpers/array';

import { MessageSendInfo } from '../../../hooks/useSendInfo';
import { MessageExtended, EmbeddedMap } from '../../../models/message';
import { Breakpoints } from '../../../models/utils';
import { MessageChange } from '../Composer';
import { Attachment } from '../../../models/attachment';
import {
    getContent,
    exportPlainText,
    plainTextToHTML,
    setDocumentContent
} from '../../../helpers/message/messageContent';
import { isPlainText as testIsPlainText } from '../../../helpers/message/messages';
import { locateBlockquote } from '../../../helpers/message/messageBlockquote';
import { removeEmbeddedHTML } from '../../../helpers/embedded/embeddedParser';
import { createEmbeddedMap } from '../../../helpers/embedded/embeddeds';
import EditorToolbarExtension from './EditorToolbarExtension';
import { findCIDsInContent } from '../../../helpers/embedded/embeddedFinder';

interface ExternalEditorActions {
    setContent: (message: MessageExtended) => void;
    insertEmbedded: (embeddeds: EmbeddedMap) => void;
    removeEmbedded: (attachments: Attachment[]) => void;
}

export type EditorActionsRef = MutableRefObject<ExternalEditorActions | undefined>;

interface Props {
    message: MessageExtended;
    messageSendInfo: MessageSendInfo;
    disabled: boolean;
    breakpoints: Breakpoints;
    onReady: () => void;
    onChange: MessageChange;
    onChangeContent: (content: string) => void;
    onChangeFlag: (changes: Map<number, boolean>) => void;
    onFocus: () => void;
    onAddAttachments: (files: File[]) => void;
    onAddEmbeddedImages: (files: File[]) => void;
    onRemoveAttachment: (attachment: Attachment) => () => void;
    contentFocusRef: MutableRefObject<() => void>;
    editorActionsRef: EditorActionsRef;
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
    editorActionsRef
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
            supportImages: true
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
        }
    }, [editorReady, documentReady, isPlainText]);

    // Insert the blockquote in the editor
    // In an effect and not an handler to have blockquoteExpanded value updated on the handleInput
    useEffect(() => {
        if (blockquoteExpanded && blockquoteSaved?.length && squireEditorRef.current) {
            const content = squireEditorRef.current.value;
            squireEditorRef.current.value = content + blockquoteSaved;
        }
    }, [blockquoteExpanded]);

    // Watch for image deletion
    // Angular/src/app/squire/services/removeInlineWatcher.js
    const checkImageDeletion = useHandler(
        () => {
            const newCIDs = findCIDsInContent(squireEditorRef.current?.value || '');
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

    // Handle input considering blockquote
    const handleInput = useCallback(
        (content: string) => {
            // Squire (but not plaintext) trigger an input event when the initial content is inserted
            if (skipNextInputRef.current && !isPlainText) {
                skipNextInputRef.current = false;
                return;
            }

            checkImageDeletion();

            if (!blockquoteExpanded) {
                onChangeContent(content + blockquoteSaved);
            } else {
                onChangeContent(content);
            }
        },
        [onChangeContent]
    );

    const switchToPlainText = () => {
        const MIMEType = MIME_TYPES.PLAINTEXT;
        const plainText = exportPlainText(getContent(message));
        const embeddeds = createEmbeddedMap();
        onChange({ plainText, data: { MIMEType }, embeddeds });
    };
    const switchToHTML = () => {
        const MIMEType = MIME_TYPES.DEFAULT;
        const content = plainTextToHTML(message, mailSettings, addresses);
        const document = setDocumentContent(message.document, content);
        onChange({ document, data: { MIMEType } });
    };

    const handleChangeMetadata = useCallback(
        (change: Partial<SquireEditorMetadata>) => {
            if (change.isPlainText !== undefined) {
                if (change.isPlainText) {
                    switchToPlainText();
                } else {
                    switchToHTML();
                }
            }
            if (change.rightToLeft !== undefined) {
                onChange({ data: { RightToLeft: change.rightToLeft } });
            }
        },
        [onChange, message, mailSettings, addresses]
    );

    // Editors actions ref to add and remove embedded image
    const handleInsertEmbedded = useHandler(async (embeddeds: EmbeddedMap) => {
        embeddeds.forEach((info, cid) => {
            squireEditorRef.current?.insertImage(info.url || '', {
                'data-embedded-img': cid,
                alt: info.attachment.Name
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
            setContent: handleSetContent,
            insertEmbedded: handleInsertEmbedded,
            removeEmbedded: handleRemoveEmbedded
        };
        contentFocusRef.current = () => {
            squireEditorRef.current?.focus();
        };
    }, [blockquoteExpanded, blockquoteSaved]);

    const handleEllipseClick = useCallback(() => setBlockquoteExpanded(true), []);
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
            toolbarMoreDropdownExtension={<EditorToolbarExtension message={message} onChangeFlag={onChangeFlag} />}
        />
    );
};

export default memo(SquireEditorWrapper);
