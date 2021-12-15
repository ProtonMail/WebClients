import { useCallback, useEffect, useRef, useState } from 'react';
import { OpenPGPKey } from 'pmcrypto';

import { noop } from '@proton/shared/lib/helpers/function';
import { useActiveBreakpoint, useHandler } from '@proton/components';
import { eoDefaultMailSettings } from '@proton/shared/lib/mail/eo/constants';

import ComposerContent from '../../composer/ComposerContent';
import { MessageState, OutsideKey } from '../../../logic/messages/messagesTypes';
import { createNewDraft } from '../../../helpers/message/messageDraft';
import { MESSAGE_ACTIONS } from '../../../constants';
import { EditorActionsRef } from '../../composer/editor/SquireEditorWrapper';
import { MessageChange } from '../../composer/Composer';
import { setContent } from '../../../helpers/message/messageContent';
import { mergeMessages } from '../../../helpers/message/messages';
import EOReplyFooter from './EOReplyFooter';
import { useEOAttachments } from '../../../hooks/composer/useEOAttachments';
import ComposerInsertImageModal from '../../composer/modals/ComposerInsertImageModal';

interface Props {
    referenceMessage: MessageState;
    isFocused: boolean;
    id: string;
    publicKey?: OpenPGPKey[];
    outsideKey?: OutsideKey;
}

const EOComposer = ({ referenceMessage, isFocused, id, publicKey, outsideKey }: Props) => {
    const breakpoints = useActiveBreakpoint();
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
            [],
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            (ID) => {
                return undefined;
            }
        ) as MessageState
    );

    console.log('MODEL MESSG', { modelMessage, doc: modelMessage.messageDocument?.document?.innerHTML });

    // Get a ref on the editor to trigger insertion of embedded images
    const editorActionsRef: EditorActionsRef = useRef();

    // Manage focus from the container yet keeping logic in each component
    const contentFocusRef = useRef<() => void>(noop);

    const lock = opening;

    useEffect(() => {
        if (editorReady) {
            setOpening(false);
        }
    }, [editorReady]);

    const timeoutRef = useRef(0);

    // Manage focus at opening
    useEffect(() => {
        if (!opening && isFocused) {
            timeoutRef.current = window.setTimeout(() => {
                contentFocusRef.current();
            });
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [opening, isFocused]);

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

    const handleEditorReady = useCallback(() => setEditorReady(true), []);

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
            <div className="composer-body-container eo-composer flex flex-column flex-nowrap flex-item-fluid-auto max-w100 mt0-5">
                <ComposerContent
                    message={modelMessage}
                    disabled={lock}
                    breakpoints={breakpoints}
                    onEditorReady={handleEditorReady}
                    onChange={handleChange}
                    onChangeContent={handleChangeContent}
                    onAddAttachments={handleAddAttachments}
                    onRemoveAttachment={handleRemoveAttachment}
                    contentFocusRef={contentFocusRef}
                    editorActionsRef={editorActionsRef}
                    isOutside
                    outsideKey={outsideKey}
                />
            </div>
            <EOReplyFooter id={id} onAddAttachments={handleAddAttachments} />
        </>
    );
};

export default EOComposer;
