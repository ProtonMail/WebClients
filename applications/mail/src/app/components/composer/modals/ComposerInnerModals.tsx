import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Alert, ErrorButton } from '@proton/components';
import type { Cancellable } from '@proton/components/hooks/useHandler';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';
import type { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';

import { ComposerInnerModalStates } from '../../../hooks/composer/useComposerInnerModals';
import type { MessageState } from '../../../store/messages/messagesTypes';
import type { MessageChange } from '../Composer';
import ComposerAssistantSettingModal from './ComposerAssistantSettingModal';
import ComposerExpirationModal from './ComposerExpirationModal';
import ComposerInnerModal from './ComposerInnerModal';
import ComposerInsertImageModal from './ComposerInsertImageModal';
import ComposerPasswordModal from './ComposerPasswordModal';
import ComposerScheduleSendModal from './ComposerScheduleSendModal';

interface Props {
    innerModal: ComposerInnerModalStates;
    message: MessageState;
    handleChange: MessageChange;
    pendingFiles?: File[];
    handleCloseInnerModal: () => void;
    handleScheduleSend: (scheduledAt: number) => void;
    handleCloseInsertImageModal: () => void;
    handleAddAttachmentsUpload: ((action: ATTACHMENT_DISPOSITION, files?: File[]) => Promise<void>) & Cancellable;
    handleDelete: () => void;
    handleSendAnyway: () => void;
    handleCancelSend: (error: string) => void;
    attachmentsFoundKeyword: string;
    noReplyEmail: string;
    composerID: string;
    handleToggleAssistant: (aiFlag: AI_ASSISTANT_ACCESS) => void;
}

const ComposerInnerModals = ({
    innerModal,
    message,
    handleChange,
    pendingFiles,
    handleCloseInnerModal,
    handleScheduleSend,
    handleCloseInsertImageModal,
    handleAddAttachmentsUpload,
    handleDelete,
    handleSendAnyway,
    handleCancelSend,
    attachmentsFoundKeyword,
    noReplyEmail,
    composerID,
    handleToggleAssistant,
}: Props) => {
    const boldNoReplyEmail = <strong key="no-reply-email">{noReplyEmail}</strong>;
    return (
        <>
            {innerModal === ComposerInnerModalStates.Password && (
                <ComposerPasswordModal message={message} onClose={handleCloseInnerModal} onChange={handleChange} />
            )}
            {innerModal === ComposerInnerModalStates.Expiration && (
                <ComposerExpirationModal message={message} onClose={handleCloseInnerModal} onChange={handleChange} />
            )}
            {innerModal === ComposerInnerModalStates.ScheduleSend && (
                <ComposerScheduleSendModal
                    onClose={handleCloseInnerModal}
                    onSubmit={handleScheduleSend}
                    message={message}
                />
            )}
            {innerModal === ComposerInnerModalStates.InsertImage && pendingFiles && (
                <ComposerInsertImageModal
                    files={pendingFiles}
                    onClose={handleCloseInsertImageModal}
                    onSelect={handleAddAttachmentsUpload}
                />
            )}
            {innerModal === ComposerInnerModalStates.DeleteDraft && (
                <ComposerInnerModal
                    title={c('Title').t`Delete draft`}
                    onCancel={handleCloseInnerModal}
                    onSubmit={handleDelete}
                    submitActions={<ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>}
                >
                    <Alert className="mb-4" type="error">{c('Info')
                        .t`Are you sure you want to permanently delete this draft?`}</Alert>
                </ComposerInnerModal>
            )}
            {innerModal === ComposerInnerModalStates.NoRecipients && (
                <ComposerInnerModal
                    title={c('Title').t`Recipient missing`}
                    onCancel={() => handleCancelSend('recipient missing')}
                    onSubmit={() => handleCancelSend('recipient missing')}
                    displayCancel={false}
                    submit={c('Action').t`Got it`}
                    data-testid={'composer:modal:norecipients'}
                >
                    <p className="text-left m-0">{c('Info').t`Please add at least one recipient.`}</p>
                </ComposerInnerModal>
            )}
            {innerModal === ComposerInnerModalStates.NoSubjects && (
                <ComposerInnerModal
                    title={c('Title').t`Subject missing`}
                    onCancel={() => handleCancelSend('subject missing')}
                    onSubmit={handleSendAnyway}
                    submit={c('Action').t`Send anyway`}
                    data-testid={'composer:modal:nosubject'}
                >
                    <p className="text-left m-0">{c('Info')
                        .t`You have not given your email any subject. Do you want to send the message anyway?`}</p>
                </ComposerInnerModal>
            )}
            {innerModal === ComposerInnerModalStates.NoAttachments && (
                <ComposerInnerModal
                    title={c('Title').t`No attachment found`}
                    onCancel={() => handleCancelSend('attachments missing')}
                    onSubmit={handleSendAnyway}
                    submit={c('Action').t`Send anyway`}
                >
                    <Alert>
                        {c('Info')
                            .t`You wrote “${attachmentsFoundKeyword}”, but no attachment has been added. Do you want to send your message anyway?`}
                        <div>
                            <Href href={getKnowledgeBaseUrl('/attachment-reminders')}>{c('Link').t`Learn more`}</Href>
                        </div>
                    </Alert>
                </ComposerInnerModal>
            )}
            {innerModal === ComposerInnerModalStates.NoReplyEmail && (
                <ComposerInnerModal
                    title={c('Title').t`No-reply address detected`}
                    onCancel={() => handleCancelSend('no-reply email')}
                    onSubmit={handleSendAnyway}
                    submit={c('Action').t`Send anyway`}
                >
                    <Alert>
                        {
                            // translator: Full sentence is "The email address "boldNoReplyEmail" does not seem to accept replies. Are you sure you want to send your message?"
                            c('Info')
                                .jt`The email address ${boldNoReplyEmail} does not seem to accept replies. Are you sure you want to send your message?`
                        }
                    </Alert>
                </ComposerInnerModal>
            )}
            {innerModal === ComposerInnerModalStates.AssistantSettings && (
                <ComposerAssistantSettingModal
                    onClose={handleCloseInnerModal}
                    composerID={composerID}
                    onToggleAssistant={handleToggleAssistant}
                />
            )}
        </>
    );
};

export default ComposerInnerModals;
