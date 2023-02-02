import { MutableRefObject } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { EditorMetadata, FeatureCode, Icon, Tooltip, classnames, useFeature } from '@proton/components';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { hasFlag } from '@proton/shared/lib/mail/messages';

import { getAttachmentCounts } from '../../../../helpers/message/messages';
import { MessageState } from '../../../../logic/messages/messagesTypes';
import AttachmentsButton from '../../../attachment/AttachmentsButton';
import { MessageChange, MessageChangeFlag } from '../../Composer';
import { ExternalEditorActions } from '../../editor/EditorWrapper';
import ComposerMoreActions from '../ComposerMoreActions';
import ComposerPasswordActions from '../ComposerPasswordActions';
import ComposerSendButton from '../ComposerSendButton';
import ComposerScheduleSendActions from '../scheduleSend/ScheduleSendActions';
import ComposerScheduleSendSpotlight from '../scheduleSend/ScheduleSendSpotlight';
import useScheduleSendFeature from '../scheduleSend/useScheduleSendFeature';
import useScheduleSendSpotlight from '../scheduleSend/useScheduleSendSpotlight';
import useComposerSendActionsText from './useComposerActionsText';

interface Props {
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
    onSend: () => Promise<void>;
    opening: boolean;
    syncInProgress: boolean;
}

const ComposerActions = ({
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
}: Props) => {
    const disabled = opening;
    const { canScheduleSend } = useScheduleSendFeature();
    const { feature: numAttachmentsWithoutEmbeddedFeature } = useFeature(FeatureCode.NumAttachmentsWithoutEmbedded);
    const scheduleSendSpotlight = useScheduleSendSpotlight(!opening);

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

    return (
        <footer
            data-testid="composer:footer"
            className={classnames(['composer-actions flex-item-noshrink flex max-w100', className])}
            onClick={addressesBlurRef.current}
        >
            <div className="flex flex-row-reverse flex-align-self-center w100 ml0-5 mr1-5 pl1-25 pr0-25 mb1">
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
                                    <Icon name="paper-plane" className="no-desktop no-tablet on-mobile-flex" />
                                    <span className="pl1 pr1 no-mobile">{c('Action').t`Send`}</span>
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

                <div className="flex flex-item-fluid">
                    <div className="flex">
                        <Tooltip title={titleDeleteDraft}>
                            <Button
                                icon
                                disabled={disabled}
                                onClick={onDelete}
                                shape="ghost"
                                className="mr0-5"
                                data-testid="composer:delete-draft-button"
                            >
                                <Icon name="trash" alt={c('Action').t`Delete draft`} />
                            </Button>
                        </Tooltip>
                        <ComposerPasswordActions isPassword={isPassword} onChange={onChange} onPassword={onPassword} />
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
                    <div className="flex-item-fluid flex pr1">
                        <span className="mr0-5 mauto no-mobile color-weak">{dateMessage}</span>
                        <Tooltip title={titleAttachment}>
                            <AttachmentsButton
                                isAttachments={isAttachments}
                                disabled={disabled}
                                onAddAttachments={onAddAttachments}
                                attachmentTriggerRef={attachmentTriggerRef}
                                data-testid="composer:attachment-button"
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default ComposerActions;
