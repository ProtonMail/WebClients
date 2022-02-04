import { useEffect, useState, useRef, useCallback, memo, SetStateAction, Dispatch } from 'react';
import { c } from 'ttag';

import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { isPlainText as testIsPlainText } from '@proton/shared/lib/mail/messages';
import { useHandler, Editor, EditorMetadata, EditorTextDirection, EditorActions } from '@proton/components';
import diff from '@proton/utils/diff';
import useIsMounted from '@proton/hooks/useIsMounted';
import { MailSettings } from '@proton/shared/lib/interfaces';
import { MessageChange } from '../Composer';
import { getContent } from '../../../helpers/message/messageContent';
import { locateBlockquote } from '../../../helpers/message/messageBlockquote';
import { getEmbeddedImages } from '../../../helpers/message/messageImages';
import {
    createBlob,
    findCIDsInContent,
    readContentIDandLocation,
    removeEmbeddedHTML,
} from '../../../helpers/message/messageEmbeddeds';
import { MessageState } from '../../../logic/messages/messagesTypes';

export interface ExternalEditorActions {
    getContent: () => string;
    setContent: (message: MessageState) => void;
    focus: () => void;
    insertEmbedded: (attachment: Attachment, data: string | Uint8Array) => void;
    removeEmbedded: (attachment: Attachment) => void;
    /** Is editor unmounted */
    isDisposed: () => boolean | undefined;
    showLinkModal: () => void;
    openEmojiPicker: () => void;
}
interface Props {
    message: MessageState;
    disabled: boolean;
    onReady: (editorActions: ExternalEditorActions) => void;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshEditor?: boolean, silent?: boolean) => void;
    onFocus?: () => void;
    onAddAttachments: (files: File[]) => void;
    onRemoveAttachment: (attachment: Attachment) => Promise<void>;
    isOutside?: boolean;
    mailSettings?: MailSettings;
    editorMetadata: EditorMetadata;
    fileHover?: boolean;
    setFileHover?: Dispatch<SetStateAction<boolean>>;
}

const EditorWrapper = ({
    message,
    disabled,
    onReady,
    onChange,
    onChangeContent,
    onAddAttachments,
    onRemoveAttachment,
    onFocus,
    mailSettings,
    editorMetadata,
    fileHover,
    setFileHover,
}: Props) => {
    const isMounted = useIsMounted();
    const skipNextInputRef = useRef(false); // Had trouble by using a state here

    const [editorReady, setEditorReady] = useState(false);
    const [documentReady, setDocumentReady] = useState(false);
    const [blockquoteSaved, setBlockquoteSaved] = useState<string>();

    // Keep track of the containing CIDs to detect deletion
    const [cids, setCIDs] = useState<string[]>([]);

    const editorActionsRef = useRef<EditorActions>();
    const handleEditorReady = useCallback((editorActions: EditorActions) => {
        setEditorReady(true);
        editorActionsRef.current = editorActions;
    }, []);

    const canRenderEditor = !!message.data?.MIMEType;
    const isPlainText = testIsPlainText(message.data);
    const rightToLeft = message.data?.RightToLeft ? EditorTextDirection.RightToLeft : EditorTextDirection.LeftToRight;

    // Detect document ready
    useEffect(() => {
        if (isPlainText && message.messageDocument?.plainText !== undefined) {
            setDocumentReady(true);
        }
        if (!isPlainText && message.messageDocument?.document?.innerHTML) {
            setDocumentReady(true);
        }
    }, [isPlainText, message.messageDocument?.plainText, message.messageDocument?.document?.innerHTML]);

    const handleGetContent = useHandler(() => {
        const editorContent = editorActionsRef.current?.getContent() || '';

        if (!editorMetadata.blockquoteExpanded && blockquoteSaved !== '') {
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
                let hasDeletedCid = false;
                removedCIDs.forEach((cid) => {
                    const embeddedImages = getEmbeddedImages(message);
                    const attachment = embeddedImages.find((image) => image.cid === cid)?.attachment;
                    if (attachment) {
                        hasDeletedCid = true;
                        void onRemoveAttachment(attachment);
                    }
                });
                if (hasDeletedCid) {
                    editorActionsRef.current?.clearUndoHistory?.();
                }
            }

            setCIDs(newCIDs);
        },
        { debounce: 500 }
    );

    const handleSetContent = (message: MessageState) => {
        let content;

        if (isPlainText) {
            content = getContent(message);
        } else {
            const [contentBeforeBlockquote, blockquote] = locateBlockquote(message.messageDocument?.document);

            if (blockquoteSaved === undefined) {
                // Means it's the first content initialization
                content = contentBeforeBlockquote;
                setBlockquoteSaved(blockquote);
                editorMetadata.setBlockquoteExpanded?.(blockquote === '');
            } else {
                content = editorMetadata.blockquoteExpanded
                    ? contentBeforeBlockquote + blockquote
                    : contentBeforeBlockquote;
            }
        }

        skipNextInputRef.current = true;
        if (editorActionsRef.current) {
            editorActionsRef.current.setContent(content);
        }

        checkImageDeletion();
    };

    // Editors actions ref to add and remove embedded image
    const handleInsertEmbedded = useCallback((attachment: Attachment, data: string | Uint8Array) => {
        const { cid } = readContentIDandLocation(attachment);
        const url = createBlob(attachment, data);

        editorActionsRef.current?.insertImage?.(url, {
            'data-embedded-img': `cid:${cid}`,
            ...(attachment.Name ? { alt: attachment.Name } : {}),
        });

        setCIDs([...cids, cid]);
    }, []);

    const handleRemoveEmbedded = useCallback(async (attachment: Attachment) => {
        if (!editorActionsRef.current) {
            return;
        }
        const content = editorActionsRef.current.getContent();
        const contentDocument = document.createElement('div');
        contentDocument.innerHTML = content;

        if (contentDocument) {
            removeEmbeddedHTML(contentDocument, attachment);
            editorActionsRef.current.setContent(contentDocument.innerHTML);
        }
    }, []);

    /**
     * Initialize Rooster (or textarea) content at (and only) startup
     * Set content and RTL behavior
     */
    useEffect(() => {
        if (isPlainText) {
            setEditorReady(false);
        }
        if (documentReady && (isPlainText || editorReady)) {
            handleSetContent(message);

            if (rightToLeft === EditorTextDirection.RightToLeft) {
                editorActionsRef.current?.setTextDirection?.(EditorTextDirection.RightToLeft);
            }

            const isInitialContentSetInEditor = editorReady && !isPlainText;
            if (isInitialContentSetInEditor) {
                editorActionsRef.current?.clearUndoHistory?.();
            }

            const externalActions: ExternalEditorActions = {
                getContent: handleGetContent,
                setContent: handleSetContent,
                focus: () => {
                    editorActionsRef.current?.focus();
                },
                insertEmbedded: handleInsertEmbedded,
                removeEmbedded: handleRemoveEmbedded,
                isDisposed: () => editorActionsRef.current?.isDisposed(),
                showLinkModal: () => editorActionsRef.current?.showModalLink?.(),
                openEmojiPicker: () => editorActionsRef.current?.openEmojiPicker?.(),
            };
            onReady(externalActions);
        }
    }, [editorReady, documentReady, isPlainText]);

    // Once the editor initialized, we do an initial change to align the model with the editor
    useEffect(() => {
        if (documentReady && (isPlainText || (editorReady && blockquoteSaved !== undefined))) {
            onChangeContent(handleGetContent(), false, true);
        }
    }, [documentReady, isPlainText, editorReady, blockquoteSaved !== undefined]);

    // Handle input considering blockquote
    const onChangeContentCallback = useHandler((content: string) => {
        // Rooster (but not plaintext) triggers an onContentChange event when the initial content is inserted
        if (!isPlainText) {
            if (skipNextInputRef.current) {
                skipNextInputRef.current = false;
                return;
            }

            checkImageDeletion();
        }

        const nextContent = editorMetadata.blockquoteExpanded ? content : `${content}${blockquoteSaved}`;

        onChangeContent(nextContent);
    });

    const handleChangeMetadata = useCallback(
        (change: Partial<EditorMetadata>) => {
            if (change.rightToLeft !== undefined) {
                onChange({ data: { RightToLeft: change.rightToLeft } });
            }
        },
        [onChange, message]
    );

    const handleBlockquoteToggleClick = useCallback(() => {
        editorMetadata.setBlockquoteExpanded?.(true);

        skipNextInputRef.current = true;
        if (editorActionsRef.current) {
            const content = editorActionsRef.current.getContent();
            editorActionsRef.current.setContent(content + blockquoteSaved);
        }
    }, [blockquoteSaved]);

    useEffect(() => {
        // Warning: disabled is not in useEffects deps and should not be
        if (!disabled) {
            editorActionsRef.current?.focus();
        }
    }, [editorMetadata.blockquoteExpanded, blockquoteSaved, isPlainText]);

    return canRenderEditor ? (
        <Editor
            editorToolbarClassname="mb1 ml1-75 mr1-75"
            editorClassname="pl1-75 pr1-75"
            placeholder={c('Placeholder').t`Write your message`}
            metadata={editorMetadata}
            disabled={disabled}
            onChange={onChangeContentCallback}
            onChangeMetadata={handleChangeMetadata}
            onFocus={onFocus}
            showBlockquoteToggle={!editorMetadata.blockquoteExpanded}
            onBlockquoteToggleClick={handleBlockquoteToggleClick}
            onReady={handleEditorReady}
            mailSettings={mailSettings}
            onAddAttachments={onAddAttachments}
            isPlainText={isPlainText}
            fileHover={fileHover}
            setFileHover={setFileHover}
        />
    ) : null;
};

export default memo(EditorWrapper);
