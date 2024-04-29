import { memo, useCallback, useEffect, useRef, useState } from 'react';

import type { GetContentMode } from 'roosterjs-editor-types';

import type { EditorActions, EditorMetadata } from '@proton/components';
import { Editor, useHandler } from '@proton/components';
import type { EditorProps } from '@proton/components/components/editor/Editor';
import { useToolbar } from '@proton/components/components/editor/hooks/useToolbar';
import useIsMounted from '@proton/hooks/useIsMounted';
import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';
import type { MailSettings, UserSettings } from '@proton/shared/lib/interfaces';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { DIRECTION } from '@proton/shared/lib/mail/mailSettings';
import { isPlainText as testIsPlainText } from '@proton/shared/lib/mail/messages';
import diff from '@proton/utils/diff';

import { locateBlockquote } from '../../../helpers/message/messageBlockquote';
import { getContent } from '../../../helpers/message/messageContent';
import {
    createBlob,
    findCIDsInContent,
    readContentIDandLocation,
    removeEmbeddedHTML,
} from '../../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages } from '../../../helpers/message/messageImages';
import type { MessageState } from '../../../store/messages/messagesTypes';
import type { MessageChange } from '../Composer';

export interface ExternalEditorActions
    extends Pick<EditorActions, 'getSelectionContent' | 'setSelectionContent' | 'getContent'> {
    setContent: (message: MessageState) => void;
    focus: () => void;
    insertEmbedded: (attachment: Attachment, data: string | Uint8Array) => void;
    removeEmbedded: (attachment: Attachment) => void;
    /** Is editor unmounted */
    isDisposed: () => boolean | undefined;
    showLinkModal: () => void;
    openEmojiPicker: () => void;
}
interface Props extends Pick<EditorProps, 'onMouseUp' | 'onKeyUp' | 'onFocus' | 'toolbarCustomRender'> {
    message: MessageState;
    disabled: boolean;
    onReady: (editorActions: ExternalEditorActions) => void;
    onChange: MessageChange;
    onChangeContent: (content: string, refreshEditor?: boolean, silent?: boolean) => void;
    onAddAttachments: (files: File[]) => void;
    onRemoveAttachment: (attachment: Attachment) => Promise<void>;
    mailSettings?: MailSettings;
    userSettings?: UserSettings;
    editorMetadata: EditorMetadata;
}

const EditorWrapper = ({
    message,
    disabled,
    onReady,
    onChange,
    onMouseUp,
    onKeyUp,
    onChangeContent,
    onAddAttachments,
    onRemoveAttachment,
    onFocus,
    mailSettings,
    userSettings,
    editorMetadata,
    toolbarCustomRender,
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
    const rightToLeft = message.data?.RightToLeft ? DIRECTION.RIGHT_TO_LEFT : DIRECTION.LEFT_TO_RIGHT;

    // Detect document ready
    useEffect(() => {
        if (isPlainText && message.messageDocument?.plainText !== undefined) {
            setDocumentReady(true);
        }
        if (!isPlainText && message.messageDocument?.document?.innerHTML) {
            setDocumentReady(true);
        }
    }, [isPlainText, message.messageDocument?.plainText, message.messageDocument?.document?.innerHTML]);

    const handleGetContent = useHandler((format?: GetContentMode) => {
        const editorContent = editorActionsRef.current?.getContent(format) || '';

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
        const contentDocument = parseStringToDOM(content).body;

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

            if (rightToLeft === DIRECTION.RIGHT_TO_LEFT) {
                editorActionsRef.current?.setTextDirection?.(DIRECTION.RIGHT_TO_LEFT);
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
                getSelectionContent: () => editorActionsRef.current?.getSelectionContent?.(),
                setSelectionContent: (content) => editorActionsRef.current?.setSelectionContent?.(content),
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

    const { openEmojiPickerRef, toolbarConfig, setToolbarConfig, modalLink, modalImage, modalDefaultFont } = useToolbar(
        { onAddAttachments, onChangeMetadata: handleChangeMetadata }
    );

    return canRenderEditor ? (
        <Editor
            editorToolbarClassname="mb-4 mx-6"
            editorClassname="px-6"
            metadata={editorMetadata}
            disabled={disabled}
            onChange={onChangeContentCallback}
            onFocus={onFocus}
            onMouseUp={onMouseUp}
            onKeyUp={onKeyUp}
            showBlockquoteToggle={!editorMetadata.blockquoteExpanded}
            onBlockquoteToggleClick={handleBlockquoteToggleClick}
            onReady={handleEditorReady}
            mailSettings={mailSettings}
            onAddAttachments={onAddAttachments}
            isPlainText={isPlainText}
            openEmojiPickerRef={openEmojiPickerRef}
            toolbarConfig={toolbarConfig}
            setToolbarConfig={setToolbarConfig}
            modalLink={modalLink}
            modalImage={modalImage}
            modalDefaultFont={modalDefaultFont}
            userSettings={userSettings}
            toolbarCustomRender={toolbarCustomRender}
        />
    ) : null;
};

export default memo(EditorWrapper);
