import type { MutableRefObject } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { EditorMetadata } from '@proton/components';
import {
    FeatureCode,
    Icon,
    Tooltip,
    useActiveBreakpoint,
    useFeature,
    useSpotlightOnFeature,
    useUserSettings,
} from '@proton/components';
import useAssistantTelemetry from '@proton/components/containers/llm/useAssistantTelemetry';
import { getIsAssistantOpened, useAssistant } from '@proton/llm/lib';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { clearBit } from '@proton/shared/lib/helpers/bitset';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { hasFlag } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { useComposerAssistantProvider } from 'proton-mail/components/assistant/provider/ComposerAssistantProvider';
import ComposerAssistantSpotlight from 'proton-mail/components/assistant/spotlights/ComposerAssistantSpotlight';

import { getAttachmentCounts } from '../../../../helpers/message/messages';
import type { MessageState } from '../../../../store/messages/messagesTypes';
import AttachmentsButton from '../../../attachment/AttachmentsButton';
import type { MessageChange, MessageChangeFlag } from '../../Composer';
import type { ExternalEditorActions } from '../../editor/EditorWrapper';
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
    onToggleAssistant,
}: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const assistantSpotlight = useSpotlightOnFeature(FeatureCode.ComposerAssistantSpotlight, !viewportWidth['<=small']);
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

    const { initAssistant, hasCompatibleHardware, hasCompatibleBrowser, openedAssistants, downloadPaused } =
        useAssistant(composerID);

    const { displayAssistantModal } = useComposerAssistantProvider();

    const isAssistantOpened = useMemo(() => {
        return getIsAssistantOpened(openedAssistants, composerID);
    }, [composerID, openedAssistants]);

    const isSmallViewport = viewportWidth['<=small'];

    const handleToggleAssistant = () => {
        if (assistantSpotlight.show) {
            assistantSpotlight.onClose();
        }
        if (!isAssistantOpened && AIAssistantFlags === AI_ASSISTANT_ACCESS.CLIENT_ONLY) {
            if (!hasCompatibleHardware) {
                displayAssistantModal('incompatibleHardware');
                return;
            }

            if (!hasCompatibleBrowser) {
                displayAssistantModal('incompatibleBrowser');
                return;
            }

            // Start initializing the Assistant when opening it if able to
            if (!downloadPaused) {
                void initAssistant?.();
            }
        }

        onToggleAssistant();
        sendShowAssistantReport();
    };

    const handleRemoveOutsideEncryption = () => {
        onChange(
            (message) => ({
                data: {
                    Flags: clearBit(message.data?.Flags, MESSAGE_FLAGS.FLAG_INTERNAL),
                    Password: undefined,
                    PasswordHint: undefined,
                },
                draftFlags: {
                    expiresIn: undefined,
                },
            }),
            true
        );
    };

    const assistantTooltipText = (() => {
        return !assistantSpotlight.show ? c('Action').t`${BRAND_NAME} Scribe writing assistant` : '';
    })();

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
                        {!isSmallViewport && (
                            <ComposerPasswordActions
                                isPassword={isPassword}
                                onPassword={onPassword}
                                onRemoveOutsideEncryption={handleRemoveOutsideEncryption}
                            />
                        )}
                        <Tooltip title={titleAttachment}>
                            <AttachmentsButton
                                isAttachments={isAttachments}
                                disabled={disabled}
                                onAddAttachments={onAddAttachments}
                                attachmentTriggerRef={attachmentTriggerRef}
                                data-testid="composer:attachment-button"
                            />
                        </Tooltip>
                        {showAssistantButton && (
                            <>
                                <Tooltip title={assistantTooltipText}>
                                    <div>
                                        <ComposerAssistantSpotlight {...assistantSpotlight}>
                                            <Button
                                                icon
                                                disabled={disabled}
                                                onClick={handleToggleAssistant}
                                                shape="ghost"
                                                data-testid="composer:use-assistant-button"
                                                aria-expanded={isAssistantOpened}
                                                className="flex sm:mx-2"
                                            >
                                                <Icon
                                                    name="pen-sparks"
                                                    alt={c('Action').t`Your email writing assistant`}
                                                    style={{ color: '#D132EA' }}
                                                />
                                            </Button>
                                        </ComposerAssistantSpotlight>
                                    </div>
                                </Tooltip>
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
                            showExternalEncryption={isSmallViewport}
                            isPassword={isPassword}
                            onPassword={onPassword}
                            onRemoveOutsideEncryption={handleRemoveOutsideEncryption}
                        />
                    </div>
                    <div className="flex-1 flex pr-4">
                        <span className="mr-0 m-auto hidden md:flex color-weak">{dateMessage}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default ComposerActions;
