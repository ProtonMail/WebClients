import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { isPlainText as testIsPlainText } from '@proton/shared/lib/mail/messages';
import { MutableRefObject, useEffect, useState, useRef, useMemo, useCallback, memo } from 'react';
import { c } from 'ttag';
import { SquireEditor, useHandler, useMailSettings, useAddresses } from '@proton/components';
import { SquireEditorMetadata } from '@proton/components/components/editor/interface';
import { SquireEditorRef } from '@proton/components/components/editor/SquireEditor';
import { RIGHT_TO_LEFT, MIME_TYPES } from '@proton/shared/lib/constants';
import { diff } from '@proton/shared/lib/helpers/array';
import { noop } from '@proton/shared/lib/helpers/function';
import useIsMounted from '@proton/components/hooks/useIsMounted';
import { pick } from '@proton/shared/lib/helpers/object';
import { MessageExtended } from '../../../models/message';
import { Breakpoints } from '../../../models/utils';
import { MessageChange } from '../Composer';
import {
    getContent,
    exportPlainText,
    plainTextToHTML,
    setDocumentContent,
} from '../../../helpers/message/messageContent';
import { locateBlockquote } from '../../../helpers/message/messageBlockquote';
import { getEmbeddedImages } from '../../../helpers/message/messageImages';
import {
    createBlob,
    findCIDsInContent,
    readContentIDandLocation,
    removeEmbeddedHTML,
} from '../../../helpers/message/messageEmbeddeds';

interface ExternalEditorActions {
    getContent: () => string;
    setContent: (message: MessageExtended) => void;
    insertEmbedded: (attachment: Attachment, data: string | Uint8Array) => void;
    removeEmbedded: (attachment: Attachment) => void;
}

export type EditorActionsRef = MutableRefObject<ExternalEditorActions | undefined>;

interface Props {
    message: MessageExtended;
    disabled: boolean;
    breakpoints: Breakpoints;
    onReady: () => void;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshEditor?: boolean, silent?: boolean) => void;
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
    onAddAttachments,
    onRemoveAttachment,
    onFocus,
    contentFocusRef,
    editorActionsRef,
    keydownHandler = noop,
}: Props) => {
    const [mailSettings] = useMailSettings();
    const [addresses] = useAddresses();
    const isMounted = useIsMounted();

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
    const defaultFont = useMemo(
        () => (mailSettings ? pick(mailSettings, ['FontFace', 'FontSize']) : undefined),
        [mailSettings]
    );

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

    // Watch for image deletion
    // Angular/src/app/squire/services/removeInlineWatcher.js
    const checkImageDeletion = useHandler(
        () => {
            // Debounce event can be triggered after composer is closed
            if (!isMounted()) {
                return;
            }
            const newCIDs = findCIDsInContent(handleGetContent());
            const removedCIDs = diff(cids, newCIDs);

            if (removedCIDs.length) {
                removedCIDs.forEach((cid) => {
                    // const info = message.embeddeds?.get(cid);
                    const embeddedImages = getEmbeddedImages(message);
                    const attachment = embeddedImages.find((image) => image.cid === cid)?.attachment;
                    if (attachment) {
                        void onRemoveAttachment(attachment);
                    }
                });
                squireEditorRef.current?.clearUndoHistory();
            }

            setCIDs(newCIDs);
        },
        { debounce: 500 }
    );

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

        checkImageDeletion();
    };

    // Initialize Squire (or textarea) content at (and only) startup
    useEffect(() => {
        if (isPlainText) {
            setEditorReady(false);
        }
        if (documentReady && (isPlainText || editorReady)) {
            handleSetContent(message);
            onReady();
        }
    }, [editorReady, documentReady, isPlainText]);

    // Once the editor initialized, we do an initial change to align the model with the editor
    useEffect(() => {
        if (documentReady && (isPlainText || (editorReady && blockquoteSaved !== undefined))) {
            onChangeContent(handleGetContent(), false, true);
        }
    }, [documentReady, isPlainText, editorReady, blockquoteSaved !== undefined]);

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
        const plainText = exportPlainText(handleGetContent());
        const messageImages = message.messageImages ? { ...message.messageImages, images: [] } : undefined;
        onChange({ plainText, data: { MIMEType }, messageImages });
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
    const handleInsertEmbedded = useHandler((attachment: Attachment, data: string | Uint8Array) => {
        const { cid } = readContentIDandLocation(attachment);
        const url = createBlob(attachment, data);

        squireEditorRef.current?.insertImage(url, {
            'data-embedded-img': `cid:${cid}`,
            alt: attachment.Name,
        });
    });
    const handleRemoveEmbedded = useHandler(async (attachment: Attachment) => {
        const document = squireEditorRef.current?.document;
        if (document) {
            removeEmbeddedHTML(document, attachment);
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
            keydownHandler={keydownHandler}
            defaultFont={defaultFont}
        />
    );
};

export default memo(SquireEditorWrapper);
