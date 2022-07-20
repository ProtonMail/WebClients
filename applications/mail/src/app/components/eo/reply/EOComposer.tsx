import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PublicKeyReference } from '@proton/crypto';
import noop from '@proton/utils/noop';
import { EditorMetadata, EditorTextDirection, useHandler } from '@proton/components';
import { eoDefaultMailSettings, eoDefaultUserSettings } from '@proton/shared/lib/mail/eo/constants';
import { isPlainText as testIsPlainText } from '@proton/shared/lib/mail/messages';

import ComposerContent from '../../composer/ComposerContent';
import { MessageState, OutsideKey } from '../../../logic/messages/messagesTypes';
import { createNewDraft } from '../../../helpers/message/messageDraft';
import { MESSAGE_ACTIONS } from '../../../constants';
import { MessageChange } from '../../composer/Composer';
import { setContent } from '../../../helpers/message/messageContent';
import { mergeMessages } from '../../../helpers/message/messages';
import EOReplyFooter from './EOReplyFooter';
import { useEOAttachments } from '../../../hooks/eo/useEOAttachments';
import ComposerInsertImageModal from '../../composer/modals/ComposerInsertImageModal';
import EOReplyHeader from './EOReplyHeader';
import { ExternalEditorActions } from '../../composer/editor/EditorWrapper';

interface Props {
    referenceMessage: MessageState;
    id: string;
    publicKey?: PublicKeyReference[];
    outsideKey?: OutsideKey;
    numberOfReplies: number;
}

const EOComposer = ({ referenceMessage, id, publicKey, outsideKey, numberOfReplies }: Props) => {
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
            eoDefaultMailSettings,
            eoDefaultUserSettings,
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
    const rightToLeft = modelMessage.data?.RightToLeft
        ? EditorTextDirection.RightToLeft
        : EditorTextDirection.LeftToRight;
    const metadata: EditorMetadata = useMemo(
        () => ({
            supportPlainText: false,
            isPlainText,
            supportRightToLeft: true,
            rightToLeft,
            supportImages: true,
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
            publicKey,
        });

    const handleEditorReady = useCallback((editorActions) => {
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
                />
            )}
            <EOReplyHeader message={referenceMessage} />
            <div className="composer-body-container eo-composer flex flex-column flex-nowrap flex-item-fluid-auto max-w100">
                <ComposerContent
                    message={modelMessage}
                    disabled={lock}
                    onEditorReady={handleEditorReady}
                    onChange={handleChange}
                    onChangeContent={handleChangeContent}
                    onAddAttachments={handleAddAttachments}
                    onRemoveAttachment={handleRemoveAttachment}
                    outsideKey={outsideKey}
                    mailSettings={eoDefaultMailSettings}
                    editorMetadata={metadata}
                />
            </div>
            <EOReplyFooter
                id={id}
                onAddAttachments={handleAddAttachments}
                message={modelMessage}
                publicKeys={publicKey}
                outsideKey={outsideKey}
                numberOfReplies={numberOfReplies}
            />
        </>
    );
};

export default EOComposer;
