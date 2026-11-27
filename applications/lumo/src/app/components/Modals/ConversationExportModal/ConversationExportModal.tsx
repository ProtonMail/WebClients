import { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import RadioGroup from '@proton/components/components/input/RadioGroup';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { useIsGuest } from '../../../providers/IsGuestProvider';
import type { BulkConversationExportProgress } from '../../../redux/bulkConversationExport';
import {
    ChatHistoryNotLoadedError,
    EXPORT_LOG_FILENAME,
    prepareBulkConversationExport,
} from '../../../redux/bulkConversationExport';
import { useLumoDispatch } from '../../../redux/hooks';
import { LocalExportAvailableError, prepareConversationExport } from '../../../redux/sagas/conversationSnapshot';
import type { Conversation, SpaceId } from '../../../types';
import { triggerFileDownload } from '../../../util/triggerFileDownload';
import type { Format } from './exportConversation';
import { exportConversation, sanitizeTitle } from './exportConversation';

type ConversationExportModalProps = ModalProps &
    (
        | {
              /** The individual chat whose transcript will be exported. */
              conversation: Conversation;
              project?: never;
              allChats?: never;
          }
        | {
              /** The project whose saved chats will be exported together. */
              project: { id: SpaceId; title: string };
              conversation?: never;
              allChats?: never;
          }
        | {
              /** Exports the signed-in account's saved chat history. */
              allChats: true;
              conversation?: never;
              project?: never;
          }
    );

function getExportScopeCopy(conversation?: Conversation, project?: ConversationExportModalProps['project']) {
    if (conversation) {
        return {
            // translator: Title for a modal that lets the user export a conversation in different formats.
            title: c('collider_2025:Title').t`Export conversation`,
            // translator: Prompt asking the user to pick an export format for the named conversation.
            prompt: c('collider_2025:Info').jt`Choose a format to export "${conversation.title}":`,
            // translator: Export error notification for a chat that has no transcript messages.
            empty: c('collider_2025:Error').t`This chat has no messages to export.`,
            // translator: Export error notification when the transcript could not be loaded or saved.
            failed: c('collider_2025:Error').t`Couldn't export this chat. Try again.`,
            // translator: Success notification shown after the conversation file has been exported/downloaded.
            success: c('collider_2025:Success').t`Conversation exported`,
        };
    }

    // translator: Error shown when the full chat history could not be exported.
    const failed = c('collider_2025:Error').t`Couldn't export chat history. Try again.`;
    // translator: Success notification after downloading account or project chat history.
    const success = c('collider_2025:Success').t`Chats exported`;

    if (project) {
        const projectTitle = project.title;
        return {
            // translator: Title for a dialog that exports the chats in a project.
            title: c('collider_2025:Title').t`Export project chats`,
            // translator: Prompt to choose the file format for chats from the project named ${projectTitle}. ZIP is the archive format.
            prompt: c('collider_2025:Info')
                .jt`Choose a format for the chat files from "${projectTitle}". They'll be downloaded in a ZIP archive.`,
            // translator: Export error notification for a project without any saved chats.
            empty: c('collider_2025:Error').t`This project has no chats to export.`,
            failed,
            success,
        };
    }

    return {
        // translator: Title of the Settings row and dialog for exporting the account's chat history.
        title: c('collider_2025: Title').t`Export all chats`,
        // translator: Prompt to select a file format for the account's chat history. ZIP is the archive format.
        prompt: c('collider_2025:Info').t`Choose a format for your chat files. They'll be downloaded in a ZIP archive.`,
        // translator: Export error notification when the account has no saved chats.
        empty: c('collider_2025:Error').t`There are no chats to export.`,
        failed,
        success,
    };
}

interface ExportFormatPickerProps {
    /** The selected format. */
    value: Format;
    /** Updates the selected format. */
    onChange: (format: Format) => void;
    /** Locks format selection while export is running. */
    disabled: boolean;
}

const ExportFormatPicker = ({ value, onChange, disabled }: ExportFormatPickerProps) => {
    const formats = [
        {
            value: 'json',
            // translator: Name of the JSON export format option, shown as a label above its description.
            label: c('collider_2025:Label').t`JSON`,
            // translator: Describes the JSON export format option for a conversation.
            description: c('collider_2025:Info')
                .t`Structured data, aiming for compatibility with the ChatGPT export format`,
        },
        {
            value: 'md',
            // translator: Name of the Markdown export format option, shown as a label above its description.
            label: c('collider_2025:Label').t`Markdown`,
            // translator: Describes the Markdown export format option for a conversation.
            description: c('collider_2025:Info').t`Text formatted with markdown, easy to read or share`,
        },
    ] satisfies { value: Format; label: string; description: string }[];

    return (
        <div className="flex flex-column gap-2 mb-4">
            <RadioGroup
                name="conversation-export-format"
                onChange={onChange}
                value={value}
                options={formats.map(({ value: format, label, description }) => ({
                    value: format,
                    disabled,
                    label: (
                        <div className="flex-1">
                            <div>{label}</div>
                            <div className="lumo-body-small lumo-color-glyph-mid">{description}</div>
                        </div>
                    ),
                }))}
            />
        </div>
    );
};

interface ExportProgressProps {
    /** The latest preparation update. */
    progress: BulkConversationExportProgress;
    /** The accessible name for the progress bar. */
    preparingLabel: string;
}

const ExportProgress = ({ progress: { completed, total }, preparingLabel }: ExportProgressProps) => {
    // translator: Export progress. ${completed} is the number of chats loaded and converted. ${total} is the number of chats to export.
    const progressLabel = c('collider_2025:Info').ngettext(
        msgid`${completed} of ${total} chat prepared`,
        `${completed} of ${total} chats prepared`,
        total
    );

    return (
        <div className="flex flex-column flex-nowrap flex-1 gap-1 min-w-0 pr-8">
            <span className="lumo-body-small lumo-color-glyph-mid">{progressLabel}</span>
            <progress
                className="progress-bar progress-bar--norm w-full"
                max={Math.max(total, 1)}
                value={completed}
                aria-label={preparingLabel}
                aria-valuetext={progressLabel}
            />
        </div>
    );
};

export const ConversationExportModal = ({
    conversation,
    project,
    allChats,
    onClose,
    ...rest
}: ConversationExportModalProps) => {
    const [selectedFormat, setSelectedFormat] = useState<Format>('json');
    const [isPreparing, setIsPreparing] = useState(false);
    const [exportProgress, setExportProgress] = useState<BulkConversationExportProgress>();
    // Set when a single chat could not be verified and only the messages on this device can be exported.
    const [localOnlyAvailable, setLocalOnlyAvailable] = useState(false);
    // Guard repeat clicks before React disables the button and identify which attempt owns the dialog state.
    const pendingExport = useRef<AbortController | undefined>(undefined);
    const dispatch = useLumoDispatch();
    const isGuest = useIsGuest();
    const { createNotification } = useNotifications();
    const copy = getExportScopeCopy(conversation, project);

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
        setLocalOnlyAvailable(false);
        onClose?.();
    };

    const onExportClick = async (allowUnverified = false) => {
        if (pendingExport.current) {
            return;
        }
        const attempt = new AbortController();
        pendingExport.current = attempt;
        setIsPreparing(true);
        setExportProgress(undefined);
        setLocalOnlyAvailable(false);
        let success = copy.success;

        try {
            if (!conversation) {
                // Project and account exports share the ZIP builder. Only the active attempt can update progress.
                const onProgress = (progress: BulkConversationExportProgress) => {
                    if (pendingExport.current === attempt) {
                        setExportProgress(progress);
                    }
                };
                const { count, issues, file } = await dispatch(
                    prepareBulkConversationExport(project?.id, attempt.signal, selectedFormat, onProgress)
                );
                if (pendingExport.current !== attempt) {
                    return;
                }
                // Zero exported chats can mean an empty history or that every chat failed to prepare.
                if (!count) {
                    createNotification({ text: issues ? copy.failed : copy.empty, type: 'error' });
                    return;
                }
                const filename = project
                    ? `${sanitizeTitle(project.title) || 'lumo-project'}-chats.zip`
                    : 'lumo-chats.zip';
                await triggerFileDownload(file, filename);
                if (issues) {
                    const logFilename = EXPORT_LOG_FILENAME;
                    // translator: Notification after a chat export where some chats are incomplete or missing. ${logFilename} is a file inside the downloaded archive.
                    success = c('collider_2025:Info').t`Chats exported. Some chats are incomplete; see ${logFilename}.`;
                }
            } else {
                // Prepare the full transcript by default. The local-only retry can use messages already on this device.
                const snapshot = await dispatch(
                    prepareConversationExport(conversation.id, isGuest, attempt.signal, allowUnverified)
                );
                if (pendingExport.current !== attempt) {
                    return;
                }
                // Placeholder messages have no content to export.
                if (!Object.values(snapshot.messages).some((message) => !message.placeholder)) {
                    createNotification({ text: copy.empty, type: 'error' });
                    return;
                }
                await exportConversation(snapshot.conversation, snapshot.messages, selectedFormat);
            }

            // The dialog can also close while the download is being handed off, so check again before showing success.
            if (pendingExport.current !== attempt) {
                return;
            }
            createNotification({ text: success, type: success === copy.success ? 'success' : 'warning' });
            close();
        } catch (error) {
            if (pendingExport.current !== attempt) {
                return;
            }
            if (error instanceof LocalExportAvailableError) {
                // Let the user choose whether to download a potentially incomplete transcript.
                setLocalOnlyAvailable(true);
            } else if (error instanceof ChatHistoryNotLoadedError) {
                createNotification({
                    text: error.loading
                        ? // translator: Shown when the user tries to export chats before Lumo has finished loading their chat history.
                          c('collider_2025:Info').t`Your chat history is still loading. Try again in a moment.`
                        : // translator: Shown when the user tries to export chats but Lumo could not load their chat history.
                          c('collider_2025:Error')
                              .t`Couldn't load your chat history. Check your connection and try again.`,
                    type: error.loading ? 'info' : 'error',
                });
            } else {
                createNotification({ text: copy.failed, type: 'error' });
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

    return (
        <ModalTwo enableCloseWhenClickOutside onClose={close} size="large" {...rest}>
            <ModalTwoHeader title={copy.title} />
            <ModalTwoContent>
                <div className="mb-4">{copy.prompt}</div>
                <ExportFormatPicker value={selectedFormat} onChange={setSelectedFormat} disabled={isPreparing} />
                <div className="lumo-body-small lumo-color-glyph-mid">
                    {
                        // translator: Disclaimer noting that some message content may be missing from the exported file.
                        c('collider_2025:Info')
                            .t`Some content, such as images and attachments, may not be included in the exported file.`
                    }
                </div>
                {localOnlyAvailable && (
                    // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                    <p className="mt-4 mb-0 lumo-body-small lumo-color-glyph-mid" role="status">
                        {
                            // translator: Explains why exporting only the messages on this device may produce an incomplete transcript.
                            c('collider_2025:Info')
                                .t`Only messages available on this device will be exported. The export may be incomplete.`
                        }
                    </p>
                )}
            </ModalTwoContent>
            <ModalTwoFooter className="items-end justify-end">
                {isPreparing && exportProgress && (
                    <ExportProgress progress={exportProgress} preparingLabel={preparingLabel} />
                )}
                {localOnlyAvailable && !isPreparing && (
                    <Button color="weak" className="shrink-0" onClick={() => onExportClick(true)}>
                        {
                            // translator: Button to export the messages available on this device, even if the transcript may be incomplete.
                            c('collider_2025:Action').t`Export available messages`
                        }
                    </Button>
                )}
                <Button
                    color="norm"
                    className="ml-auto shrink-0"
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
