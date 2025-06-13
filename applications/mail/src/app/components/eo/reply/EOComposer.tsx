import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { EditorMetadata } from '@proton/components';
import { useHandler } from '@proton/components';
import type { PublicKeyReference } from '@proton/crypto';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { EO_DEFAULT_MAILSETTINGS, EO_DEFAULT_USER_SETTINGS } from '@proton/shared/lib/mail/eo/constants';
import { DIRECTION } from '@proton/shared/lib/mail/mailSettings';
import { isPlainText as testIsPlainText } from '@proton/shared/lib/mail/messages';
import noop from '@proton/utils/noop';

import { setContent } from '../../../helpers/message/messageContent';
import { createNewDraft } from '../../../helpers/message/messageDraft';
import { mergeMessages } from '../../../helpers/message/messages';
import { useEOAttachments } from '../../../hooks/eo/useEOAttachments';
import type { MessageState, OutsideKey } from '../../../store/messages/messagesTypes';
import type { MessageChange } from '../../composer/Composer';
import ComposerContent from '../../composer/ComposerContent';
import type { ExternalEditorActions } from '../../composer/editor/EditorWrapper';
import ComposerInsertImageModal from '../../composer/modals/ComposerInsertImageModal';
import EOReplyFooter from './EOReplyFooter';
import EOReplyHeader from './EOReplyHeader';

interface Props {
    referenceMessage: MessageState;
    id: string;
    encryptionKey?: PublicKeyReference;
    outsideKey?: OutsideKey;
    numberOfReplies: number;
}

const EOComposer = ({ referenceMessage, id, encryptionKey, outsideKey, numberOfReplies }: Props) => {
    // Indicates that the composer is in its initial opening
    // Needed to be able to force focus only at first time
    const [opening, setOpening] = useState(true);

    // Indicates that the composer is open but the edited message is not yet ready
    // Needed to prevent edition while data is not ready
    const [editorReady, setEditorReady] = useState(false);

    const [modelMessage, setModelMessage] = useState<MessageState>(
        createNewDraft(
            MESSAGE_ACTIONS.REPLY,
            referenceMessage,
            EO_DEFAULT_MAILSETTINGS,
            EO_DEFAULT_USER_SETTINGS,
            [],
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (ID) => {
                return undefined;
            },
            true
        ) as MessageState
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
                    canRemoveImageMetadata
                    mailSettings={EO_DEFAULT_MAILSETTINGS}
                />
            )}
            <EOReplyHeader message={referenceMessage} />
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
                />
            </div>
            <EOReplyFooter
                id={id}
                onAddAttachments={handleAddAttachments}
                message={modelMessage}
                encryptionKey={encryptionKey}
                outsideKey={outsideKey}
                numberOfReplies={numberOfReplies}
            />
        </>
    );
};

export default EOComposer;
