import type { MutableRefObject } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { Button, Vr } from '@proton/atoms';
import type { EditorMetadata } from '@proton/components';
import { useModalStateObject, useUser } from '@proton/components';
import {
    FeatureCode,
    Icon,
    Tooltip,
    useActiveBreakpoint,
    useFeature,
    useSpotlightOnFeature,
    useUserSettings,
} from '@proton/components';
import ComposerAssistantUpsellModal from '@proton/components/components/upsell/modal/types/ComposerAssistantUpsellModal';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import { getIsAssistantOpened, useAssistant } from '@proton/llm/lib';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { clearBit } from '@proton/shared/lib/helpers/bitset';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { hasFlag } from '@proton/shared/lib/mail/messages';
import clsx from '@proton/utils/clsx';

import { useComposerAssistantProvider } from 'proton-mail/components/assistant/provider/ComposerAssistantProvider';
import ComposerAssistantSpotlight from 'proton-mail/components/assistant/spotlights/ComposerAssistantSpotlight';
import { useMailDispatch } from 'proton-mail/store/hooks';
import { updateExpires } from 'proton-mail/store/messages/draft/messagesDraftActions';

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
    isInert: boolean;
    onToggleToolbar: () => void;
    displayToolbar: boolean;
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
    isInert,
    onToggleToolbar,
    displayToolbar,
}: Props) => {
    const [user] = useUser();
    const dispatch = useMailDispatch();

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

    const assistantUpsellModal = useModalStateObject();
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
        if (user.isFree) {
            assistantUpsellModal.openModal(true);
            return;
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
        dispatch(updateExpires({ ID: message?.localID || '', expiresIn: undefined }));
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
            // @ts-ignore
            inert={isInert ? '' : undefined}
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
                                    composerID={composerID}
                                />
                            )
                        }
                    />
                </ComposerScheduleSendSpotlight>

                <div className="flex flex-1">
                    <div className="flex gap-1 md:gap-2">
                        {!isSmallViewport && (
                            <>
                                <Tooltip title={titleDeleteDraft}>
                                    <Button
                                        icon
                                        disabled={disabled}
                                        onClick={onDelete}
                                        shape="ghost"
                                        data-testid="composer:delete-draft-button"
                                    >
                                        <Icon name="trash" alt={c('Action').t`Delete draft`} />
                                    </Button>
                                </Tooltip>
                                <ComposerPasswordActions
                                    isPassword={isPassword}
                                    onPassword={onPassword}
                                    onRemoveOutsideEncryption={handleRemoveOutsideEncryption}
                                />
                            </>
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
                                <Vr className="border-weak" aria-hidden="true" />
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
                                                aria-pressed={isAssistantOpened}
                                                className="flex"
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
                        <Tooltip title={displayToolbar ? c('Action').t`Hide toolbar` : c('Action').t`Show toolbar`}>
                            <Button
                                icon
                                disabled={disabled || editorMetadata.isPlainText}
                                onClick={onToggleToolbar}
                                shape="ghost"
                                data-testid="composer:show-toolbar-button"
                                aria-expanded={displayToolbar}
                                aria-pressed={displayToolbar}
                                className="flex"
                            >
                                <Icon name="text-style" alt={c('Action').t`Show toolbar`} />
                            </Button>
                        </Tooltip>
                        {showAssistantButton && <Vr className="border-weak" aria-hidden="true" />}
                        <ComposerMoreActions
                            isExpiration={isExpiration}
                            message={message}
                            onExpiration={onExpiration}
                            onChangeFlag={onChangeFlag}
                            lock={disabled}
                            editorActionsRef={editorActionsRef}
                            editorMetadata={editorMetadata}
                            onChange={onChange}
                            isSmallViewport={isSmallViewport}
                            isPassword={isPassword}
                            onPassword={onPassword}
                            onRemoveOutsideEncryption={handleRemoveOutsideEncryption}
                            onDelete={onDelete}
                        />
                    </div>
                    <div className="flex-1 flex pr-4">
                        <span className="mr-0 m-auto hidden md:flex color-weak">{dateMessage}</span>
                    </div>
                </div>
            </div>
            {assistantUpsellModal.render && (
                <ComposerAssistantUpsellModal modalProps={assistantUpsellModal.modalProps} />
            )}
        </footer>
    );
};

export default ComposerActions;
