import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { PublicKeyReference } from '@protontech/crypto';

import type { EditorMetadata } from '@proton/components/components/editor/interface';
import { useHandler } from '@proton/hooks/useHandler';
import { MESSAGE_ACTIONS } from '@proton/mail-message/constants';
import { getContent, setContent } from '@proton/mail-message/helpers/message/messageContent';
import { createNewDraft } from '@proton/mail-message/helpers/message/messageDraft';
import { prepareExport } from '@proton/mail-message/helpers/message/messageExport';
import { mergeMessages } from '@proton/mail-message/helpers/message/messages';
import type { MessageState, OutsideKey } from '@proton/mail-message/store/messages/messagesTypes';
import { EO_DEFAULT_MAILSETTINGS, EO_DEFAULT_USER_SETTINGS } from '@proton/shared/lib/mail/eo/constants';
import { DIRECTION } from '@proton/shared/lib/mail/mailSettings';
import { isPlainText as testIsPlainText } from '@proton/shared/lib/mail/messages';
import noop from '@proton/utils/noop';

import { useEOAttachments } from '../../hooks/eo/useEOAttachments';
import type { MessageChange } from '../composer/Composer';
import ComposerContent from '../composer/ComposerContent';
import type { ExternalEditorActions } from '../composer/editor/EditorWrapper';
import ComposerInsertImageModal from '../composer/modals/ComposerInsertImageModal';

import './EOComposer.scss';

export interface EOComposerFooterProps {
    message: MessageState;
    onAddAttachments: (files: File[]) => void;
    /** Realigns the reply with the editor, then exports its content, ready to be encrypted and sent */
    exportReplyContent: () => string;
}

interface Props {
    referenceMessage: MessageState;
    encryptionKey?: PublicKeyReference;
    outsideKey?: OutsideKey;
    /** Above the editor, for example the reference message's subject and recipients */
    header: ReactNode;
    /** Below the editor, with the reply being written, for example to send it */
    renderFooter: (props: EOComposerFooterProps) => ReactNode;
}

/** The reply editor of the page where people outside Proton answer an encrypted message */
const EOComposer = ({ referenceMessage, encryptionKey, outsideKey, header, renderFooter }: Props) => {
    // Indicates that the composer is in its initial opening
    // Needed to be able to force focus only at first time
    const [opening, setOpening] = useState(true);

    // Indicates that the composer is open but the edited message is not yet ready
    // Needed to prevent edition while data is not ready
    const [editorReady, setEditorReady] = useState(false);

    const [modelMessage, setModelMessage] = useState<MessageState>(
        createNewDraft({
            action: MESSAGE_ACTIONS.REPLY,
            referenceMessage,
            mailSettings: EO_DEFAULT_MAILSETTINGS,
            userSettings: EO_DEFAULT_USER_SETTINGS,
            addresses: [],
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            getAttachment: (ID) => {
                return undefined;
            },
            isOutside: true,
        }) as MessageState
    );

    // Get a ref on the editor to trigger insertion of embedded images
    const editorActionsRef = useRef<ExternalEditorActions>();

    // Manage focus from the container yet keeping logic in each component
    const contentFocusRef = useRef<() => void>(noop);

    const lock = opening;

    const [blockquoteExpanded, setBlockquoteExpanded] = useState(true);

    const isPlainText = testIsPlainText(modelMessage.data);
    const rightToLeft = modelMessage.data?.RightToLeft ? DIRECTION.RIGHT_TO_LEFT : DIRECTION.LEFT_TO_RIGHT;
    const metadata: EditorMetadata = useMemo(
        () => ({
            supportPlainText: false,
            isPlainText,
            supportRightToLeft: true,
            rightToLeft,
            supportFiles: true,
            supportDefaultFontSelector: false,
            blockquoteExpanded,
            setBlockquoteExpanded,
        }),
        [isPlainText, rightToLeft, blockquoteExpanded, setBlockquoteExpanded]
    );

    useEffect(() => {
        if (editorReady) {
            setOpening(false);
        }
    }, [editorReady]);

    // Manage focus at opening
    useEffect(() => {
        if (!opening) {
            contentFocusRef.current();
        }
    }, [opening]);

    const handleChange: MessageChange = useHandler((update) => {
        setModelMessage((modelMessage) => {
            const messageChanges = update instanceof Function ? update(modelMessage) : update;
            return mergeMessages(modelMessage, messageChanges);
        });
    });

    const handleChangeContent = useHandler((content: string, refreshEditor: boolean = false) => {
        setModelMessage((modelMessage) => {
            setContent(modelMessage, content);
            const newModelMessage = { ...modelMessage };
            if (refreshEditor) {
                editorActionsRef.current?.setContent(newModelMessage);
            }
            return newModelMessage;
        });
    });

    const { imagesToInsert, setImagesToInsert, handleAddAttachments, handleRemoveAttachment, handleUploadImage } =
        useEOAttachments({
            message: modelMessage,
            onChange: handleChange,
            editorActionsRef,
            encryptionKey,
        });

    const handleEditorReady = useCallback((editorActions: ExternalEditorActions) => {
        setEditorReady(true);
        editorActionsRef.current = editorActions;
    }, []);

    /** Mirrors `ensureMessageContent` in the main composer: Rooster can miss an input event,
     *  and EditorWrapper deliberately swallows the one that follows a programmatic setContent.
     *  The main composer recovers because it re-reads the editor before sending, and because
     *  autosave has already persisted the draft. EO has neither, so without this the reply is
     *  encrypted from a model that never received what the recipient typed.
     *
     *  Two conditions keep the realignment from *removing* content:
     *  - `editorReady` means EditorWrapper has run its initialisation, so `getContent` appends
     *    the saved blockquote. The ref alone is not enough: it is assigned in the same callback
     *    that queues `editorReady`, so a fast click can read an editor that still reports only
     *    the content before the blockquote.
     *  - an empty editor is never adopted; the model is the better source at that point, and
     *    `send` refuses an empty body anyway.
     *
     *  The realignment has to be synchronous: `setModelMessage` would not have run by the time
     *  the content is exported below.
     */
    const exportReplyContent = () => {
        const editorActions = editorActionsRef.current;

        if (editorReady && editorActions && !editorActions.isDisposed()) {
            const editorContent = editorActions.getContent();

            if (editorContent.trim() !== '' && editorContent.trim() !== getContent(modelMessage).trim()) {
                setContent(modelMessage, editorContent);
                setModelMessage({ ...modelMessage });
            }
        }

        return prepareExport(modelMessage);
    };

    const handleCloseInsertImageModal = () => {
        setImagesToInsert([]);
    };

    return (
        <>
            {imagesToInsert.length > 0 && (
                <ComposerInsertImageModal
                    files={imagesToInsert}
                    onClose={handleCloseInsertImageModal}
                    onSelect={handleUploadImage}
                    mailSettings={EO_DEFAULT_MAILSETTINGS}
                />
            )}
            {header}
            <div className="composer-body-container eo-composer flex flex-column flex-nowrap flex-auto max-w-full">
                <ComposerContent
                    message={modelMessage}
                    disabled={lock}
                    onEditorReady={handleEditorReady}
                    onChange={handleChange}
                    onChangeContent={handleChangeContent}
                    onAddAttachments={handleAddAttachments}
                    onRemoveAttachment={handleRemoveAttachment}
                    outsideKey={outsideKey}
                    mailSettings={EO_DEFAULT_MAILSETTINGS}
                    userSettings={EO_DEFAULT_USER_SETTINGS}
                    editorMetadata={metadata}
                    isOutside
                    // We force the value to true to disable inline image reupload on EO composer
                    isInlineImageReuploadDisabled={true}
                />
            </div>
            {renderFooter({ message: modelMessage, onAddAttachments: handleAddAttachments, exportReplyContent })}
        </>
    );
};

export default EOComposer;
