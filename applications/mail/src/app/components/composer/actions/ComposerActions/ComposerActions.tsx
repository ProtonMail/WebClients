import { MutableRefObject, useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AssistantIncompatibleBrowserModal,
    AssistantIncompatibleHardwareModal,
    EditorMetadata,
    FeatureCode,
    Icon,
    Tooltip,
    useFeature,
    useModalState,
    useUserSettings,
} from '@proton/components';
import { getIsAssistantOpened, useAssistant } from '@proton/llm/lib';
import useAssistantTelemetry from '@proton/llm/lib/useAssistantTelemetry';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { hasFlag } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { getAttachmentCounts } from '../../../../helpers/message/messages';
import { MessageState } from '../../../../store/messages/messagesTypes';
import AttachmentsButton from '../../../attachment/AttachmentsButton';
import { MessageChange, MessageChangeFlag } from '../../Composer';
import { ExternalEditorActions } from '../../editor/EditorWrapper';
import ComposerMoreActions from '../ComposerMoreActions';
import ComposerPasswordActions from '../ComposerPasswordActions';
import ComposerSendButton from '../ComposerSendButton';
import ComposerScheduleSendActions from '../scheduleSend/ScheduleSendActions';
import ComposerScheduleSendSpotlight from '../scheduleSend/ScheduleSendSpotlight';
import useScheduleSendSpotlight from '../scheduleSend/useScheduleSendSpotlight';
import useComposerSendActionsText from './useComposerActionsText';

interface Props {
    composerID: string;
    addressesBlurRef: MutableRefObject<() => void>;
    attachmentTriggerRef: MutableRefObject<() => void>;
    className?: string;
    date: Date;
    editorActionsRef: MutableRefObject<ExternalEditorActions | undefined>;
    editorMetadata: EditorMetadata;
    loadingScheduleCount: boolean;
    message: MessageState;
    onAddAttachments: (files: File[]) => void;
    onChange: MessageChange;
    onChangeFlag: MessageChangeFlag;
    onDelete: () => void;
    onExpiration: () => void;
    onPassword: () => void;
    onScheduleSendModal: () => void;
    onScheduleSend: (scheduledAt: number) => void;
    canScheduleSend: boolean;
    onSend: () => Promise<void>;
    opening: boolean;
    syncInProgress: boolean;
    showAssistantButton: boolean;
    disableAssistant: boolean;
    onToggleAssistant: () => void;
}

const ComposerActions = ({
    composerID,
    addressesBlurRef,
    attachmentTriggerRef,
    className,
    date,
    editorActionsRef,
    editorMetadata,
    loadingScheduleCount,
    message,
    onAddAttachments,
    onChange,
    onChangeFlag,
    onDelete,
    onExpiration,
    onPassword,
    onScheduleSendModal,
    onScheduleSend,
    onSend,
    opening,
    syncInProgress,
    canScheduleSend,
    showAssistantButton,
    disableAssistant,
    onToggleAssistant,
}: Props) => {
    const disabled = opening;
    const [{ AIAssistantFlags }] = useUserSettings();
    const { feature: numAttachmentsWithoutEmbeddedFeature } = useFeature(FeatureCode.NumAttachmentsWithoutEmbedded);
    const scheduleSendSpotlight = useScheduleSendSpotlight(!opening);
    const { sendShowAssistantReport } = useAssistantTelemetry();

    const { pureAttachmentsCount, attachmentsCount } = message.data?.Attachments
        ? getAttachmentCounts(message.data?.Attachments, message.messageImages)
        : { pureAttachmentsCount: 0, attachmentsCount: 0 };

    const isAttachments = numAttachmentsWithoutEmbeddedFeature?.Value ? pureAttachmentsCount > 0 : attachmentsCount > 0;
    const isPassword = hasFlag(MESSAGE_FLAGS.FLAG_INTERNAL)(message.data) && !!message.data?.Password;
    const isExpiration = !!message.draftFlags?.expiresIn;
    const { dateMessage, titleAttachment, titleDeleteDraft, titleSendButton } = useComposerSendActionsText({
        date,
        opening,
        syncInProgress,
    });

    const { initAssistant, hasCompatibleHardware, hasCompatibleBrowser, openedAssistants } = useAssistant(composerID);

    const [assistantIncompatibleHardwareProps, setAssistantIncompatibleHardwareModalOpen] = useModalState();
    const [assistantIncompatibleBrowserProps, setAssistantIncompatibleBrowserModalOpen] = useModalState();

    const isAssistantOpened = useMemo(() => {
        return getIsAssistantOpened(openedAssistants, composerID);
    }, [composerID, openedAssistants]);

    const handleToggleAssistant = () => {
        if (AIAssistantFlags === AI_ASSISTANT_ACCESS.CLIENT_ONLY) {
            if (!hasCompatibleHardware) {
                setAssistantIncompatibleHardwareModalOpen(true);
                sendShowAssistantReport();
                return;
            }

            if (!hasCompatibleBrowser) {
                setAssistantIncompatibleBrowserModalOpen(true);
                sendShowAssistantReport();
                return;
            }

            // Start initializing the Assistant when opening it if able to
            const shouldInitAssistant = !isAssistantOpened;

            if (shouldInitAssistant) {
                void initAssistant?.();
            }
        }

        onToggleAssistant();

        sendShowAssistantReport();
    };

    return (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events
        <footer
            data-testid="composer:footer"
            className={clsx(['composer-actions shrink-0 flex max-w-full', className])}
            onClick={addressesBlurRef.current}
        >
            <div className="flex flex-row-reverse self-center w-full ml-2 mr-6 pl-5 pr-1 mb-4">
                <ComposerScheduleSendSpotlight
                    anchorRef={scheduleSendSpotlight.anchorRef}
                    onDisplayed={scheduleSendSpotlight.spotlight.onDisplayed}
                    showSpotlight={scheduleSendSpotlight.spotlight.show}
                >
                    <ComposerSendButton
                        shape="solid"
                        color="norm"
                        primaryAction={
                            <Tooltip title={titleSendButton}>
                                <Button
                                    onClick={onSend}
                                    disabled={disabled}
                                    className="composer-send-button"
                                    data-testid="composer:send-button"
                                >
                                    <Icon name="paper-plane" className="md:hidden flex" />
                                    <span className="px-4 hidden md:inline">{c('Action').t`Send`}</span>
                                </Button>
                            </Tooltip>
                        }
                        secondaryAction={
                            canScheduleSend && (
                                <ComposerScheduleSendActions
                                    ref={scheduleSendSpotlight.anchorRef}
                                    loading={loadingScheduleCount}
                                    onDropdownToggle={() => {
                                        scheduleSendSpotlight.spotlight.onClose();
                                    }}
                                    onDisplayScheduleSendModal={onScheduleSendModal}
                                    onScheduleSend={onScheduleSend}
                                    scheduledAtUnixTimestamp={message.draftFlags?.scheduledAt}
                                />
                            )
                        }
                    />
                </ComposerScheduleSendSpotlight>

                <div className="flex flex-1">
                    <div className="flex">
                        <Tooltip title={titleDeleteDraft}>
                            <Button
                                icon
                                disabled={disabled}
                                onClick={onDelete}
                                shape="ghost"
                                className="mr-1 sm:mr-2"
                                data-testid="composer:delete-draft-button"
                            >
                                <Icon name="trash" alt={c('Action').t`Delete draft`} />
                            </Button>
                        </Tooltip>
                        <ComposerPasswordActions isPassword={isPassword} onChange={onChange} onPassword={onPassword} />
                        <Tooltip title={titleAttachment}>
                            <AttachmentsButton
                                isAttachments={isAttachments}
                                disabled={disabled}
                                onAddAttachments={onAddAttachments}
                                attachmentTriggerRef={attachmentTriggerRef}
                                data-testid="composer:attachment-button"
                            />
                        </Tooltip>
                        <span className="vr border-weak mx-1 sm:mx-2 hidden sm:flex" aria-hidden="true"></span>
                        {showAssistantButton && (
                            <>
                                <Tooltip title={c('Action').t`Your email writing assistant`}>
                                    <Button
                                        icon
                                        disabled={disabled || disableAssistant}
                                        onClick={handleToggleAssistant}
                                        shape="ghost"
                                        data-testid="composer:use-assistant-button"
                                        aria-expanded={isAssistantOpened}
                                        className="hidden sm:flex"
                                    >
                                        <Icon
                                            name="pen-sparks"
                                            alt={c('Action').t`Your email writing assistant`}
                                            style={{ color: '#D132EA' }}
                                        />
                                    </Button>
                                </Tooltip>
                                <span className="vr border-weak mx-2 hidden sm:flex" aria-hidden="true"></span>
                            </>
                        )}
                        <ComposerMoreActions
                            isExpiration={isExpiration}
                            message={message}
                            onExpiration={onExpiration}
                            onChangeFlag={onChangeFlag}
                            lock={disabled}
                            editorActionsRef={editorActionsRef}
                            editorMetadata={editorMetadata}
                            onChange={onChange}
                        />
                    </div>
                    <div className="flex-1 flex pr-4">
                        <span className="mr-0 m-auto hidden md:flex color-weak">{dateMessage}</span>
                    </div>
                </div>
            </div>
            <AssistantIncompatibleHardwareModal modalProps={assistantIncompatibleHardwareProps} />
            <AssistantIncompatibleBrowserModal modalProps={assistantIncompatibleBrowserProps} />
        </footer>
    );
};

export default ComposerActions;
