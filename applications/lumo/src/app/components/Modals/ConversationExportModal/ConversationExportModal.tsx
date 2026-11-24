import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { useIsGuest } from '../../../providers/IsGuestProvider';
import { useLumoDispatch } from '../../../redux/hooks';
import { LocalExportAvailableError, prepareConversationExport } from '../../../redux/sagas/conversationSnapshot';
import type { Conversation } from '../../../types';
import type { Format } from './exportConversation';
import { exportConversation } from './exportConversation';

interface Props extends ModalProps {
    conversation: Conversation;
}

export const ConversationExportModal = ({ conversation, onClose, ...rest }: Props) => {
    const [selectedFormat, setSelectedFormat] = useState<Format>('json');
    const [isPreparing, setIsPreparing] = useState(false);
    const [error, setError] = useState<'empty' | 'failed' | 'available'>();
    // Guard repeat clicks before React disables the button and identify which attempt owns the dialog state.
    const pendingExport = useRef<AbortController | undefined>(undefined);
    const dispatch = useLumoDispatch();
    const isGuest = useIsGuest();
    const { createNotification } = useNotifications();

    // Unmounting can bypass close(), for example when the chat row disappears during a fetch.
    useEffect(() => {
        return () => {
            pendingExport.current?.abort();
            pendingExport.current = undefined;
        };
    }, []);

    const close = () => {
        // Stop preparing the snapshot and ignore any download handoff already in flight.
        pendingExport.current?.abort();
        pendingExport.current = undefined;
        setIsPreparing(false);
        setError(undefined);
        onClose?.();
    };

    const onExportClick = async (allowUnverified = false) => {
        if (pendingExport.current) {
            return;
        }
        const attempt = new AbortController();
        pendingExport.current = attempt;
        setIsPreparing(true);
        setError(undefined);

        try {
            const snapshot = await dispatch(
                prepareConversationExport(conversation.id, isGuest, attempt.signal, allowUnverified)
            );
            if (pendingExport.current !== attempt) {
                return;
            }
            if (!Object.values(snapshot.messages).some((message) => !message.placeholder)) {
                setError('empty');
                return;
            }

            // The dialog can also close while the download is being handed off, so check again before showing success.
            await exportConversation(snapshot.conversation, snapshot.messages, selectedFormat);
            if (pendingExport.current !== attempt) {
                return;
            }
            createNotification({
                // translator: Success notification shown after the conversation file has been exported/downloaded.
                text: c('collider_2025:Success').t`Conversation exported`,
                type: 'success',
            });
            close();
        } catch (error) {
            if (pendingExport.current === attempt) {
                setError(error instanceof LocalExportAvailableError ? 'available' : 'failed');
            }
        } finally {
            // A stale attempt must not clear the loading state of a newer export.
            if (pendingExport.current === attempt) {
                pendingExport.current = undefined;
                setIsPreparing(false);
            }
        }
    };

    // translator: Button label that confirms and triggers the conversation export.
    const exportLabel = c('collider_2025:Action').t`Export`;
    // translator: Export button label shown while the chat transcript is being loaded for download.
    const preparingLabel = c('collider_2025:Action').t`Preparing export…`;
    // translator: Export dialog error for a chat that has no transcript messages.
    const emptyMessage = c('collider_2025:Error').t`This chat has no messages to export.`;
    // translator: Export dialog error when the transcript could not be loaded or saved.
    const failedMessage = c('collider_2025:Error').t`Couldn't export this chat. Try again.`;
    // translator: Explains why exporting only the messages on this device may produce an incomplete transcript.
    const availableMessage = c('collider_2025:Info')
        .t`Only messages available on this device will be exported. The export may be incomplete.`;
    // translator: Button to export the messages available on this device, even if the transcript may be incomplete.
    const exportAvailableLabel = c('collider_2025:Action').t`Export available messages`;

    // translator: Name of the JSON export format option, shown as a label above its description.
    const jsonLabel = c('collider_2025:Label').t`JSON`;
    // translator: Describes the JSON export format option for a conversation.
    const jsonDescription = c('collider_2025:Info')
        .t`Structured data, aiming for compatibility with the ChatGPT export format`;
    // translator: Name of the Markdown export format option, shown as a label above its description.
    const markdownLabel = c('collider_2025:Label').t`Markdown`;
    // translator: Describes the Markdown export format option for a conversation.
    const markdownDescription = c('collider_2025:Info').t`Text formatted with markdown, easy to read or share`;

    return (
        <ModalTwo enableCloseWhenClickOutside onClose={close} size="large" {...rest}>
            <ModalTwoHeader
                title={
                    // translator: Title for a modal that lets the user export a conversation in different formats.
                    c('collider_2025:Title').t`Export conversation`
                }
            />
            <ModalTwoContent>
                <div className="mb-4">
                    {
                        // translator: Prompt asking the user to pick an export format for the named conversation.
                        c('collider_2025:Info').jt`Choose a format to export "${conversation.title}":`
                    }
                </div>
                <div className="flex flex-column gap-2 mb-4">
                    <RadioGroup
                        name="conversation-export-format"
                        onChange={setSelectedFormat}
                        options={[
                            {
                                label: (
                                    <div className="flex-1">
                                        <div>{jsonLabel}</div>
                                        <div className="lumo-body-small lumo-color-glyph-mid">{jsonDescription}</div>
                                    </div>
                                ),
                                value: 'json',
                                disabled: isPreparing,
                            },
                            {
                                label: (
                                    <div className="flex-1">
                                        <div>{markdownLabel}</div>
                                        <div className="lumo-body-small lumo-color-glyph-mid">
                                            {markdownDescription}
                                        </div>
                                    </div>
                                ),
                                value: 'md',
                                disabled: isPreparing,
                            },
                        ]}
                        value={selectedFormat}
                    />
                </div>
                <div className="lumo-body-small lumo-color-glyph-mid">
                    {
                        // translator: Disclaimer noting that some message content may be missing from the exported file.
                        c('collider_2025:Info')
                            .t`Some content, such as images and attachments, may not be included in the exported file.`
                    }
                </div>
                {error === 'available' && (
                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                    <p className="mt-4 mb-0 lumo-body-small lumo-color-glyph-mid" role="status">
                        {availableMessage}
                    </p>
                )}
                {error && error !== 'available' && (
                    <p className="mt-4 mb-0 lumo-body-small lumo-color-signal-danger" role="alert">
                        {error === 'empty' ? emptyMessage : failedMessage}
                    </p>
                )}
            </ModalTwoContent>
            <ModalTwoFooter className="justify-end">
                {error === 'available' && (
                    <Button color="weak" onClick={() => onExportClick(true)}>
                        {exportAvailableLabel}
                    </Button>
                )}
                <Button
                    color="norm"
                    loading={isPreparing}
                    aria-label={isPreparing ? preparingLabel : undefined}
                    onClick={() => onExportClick()}
                >
                    {isPreparing ? preparingLabel : exportLabel}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
