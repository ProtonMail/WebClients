import { c } from 'ttag';
import { Alert, ErrorButton } from '@proton/components';
import { Abortable } from '@proton/components/hooks/useHandler';
import ComposerPasswordModal from './ComposerPasswordModal';
import ComposerExpirationModal from './ComposerExpirationModal';
import ComposerScheduleSendModal from './ComposerScheduleSendModal';
import ComposerInsertImageModal from './ComposerInsertImageModal';
import ComposerInnerModal from './ComposerInnerModal';
import { MessageChange } from '../Composer';
import { ATTACHMENT_ACTION } from '../../../helpers/attachment/attachmentUploader';
import { ComposerInnerModalStates } from '../../../hooks/composer/useComposerInnerModals';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props {
    innerModal: ComposerInnerModalStates;
    message: MessageState;
    handleChange: MessageChange;
    pendingFiles?: File[];
    handleCloseInnerModal: () => void;
    handleScheduleSend: (scheduledAt: number) => void;
    handleCloseInsertImageModal: () => void;
    handleAddAttachmentsUpload: ((action: ATTACHMENT_ACTION, files?: File[]) => Promise<void>) & Abortable;
    handleDelete: () => void;
    handleSendAnyway: () => void;
    handleCancelSend: (error: string) => void;
    attachmentsFoundKeyword: string;
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
}: Props) => {
    return (
        <>
            {innerModal === ComposerInnerModalStates.Password && (
                <ComposerPasswordModal message={message.data} onClose={handleCloseInnerModal} onChange={handleChange} />
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
                    <Alert className="mb1" type="error">{c('Info')
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
                >
                    <p className="text-left m0">{c('Info').t`Please add at least one recipient.`}</p>
                </ComposerInnerModal>
            )}
            {innerModal === ComposerInnerModalStates.NoSubjects && (
                <ComposerInnerModal
                    title={c('Title').t`Subject missing`}
                    onCancel={() => handleCancelSend('subject missing')}
                    onSubmit={handleSendAnyway}
                    submit={c('Action').t`Send anyway`}
                >
                    <p className="text-left m0">{c('Info')
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
                    <Alert learnMore="https://protonmail.com/support/knowledge-base/attachment-reminders/">
                        {c('Info')
                            .t`You wrote “${attachmentsFoundKeyword}”, but no attachment has been added. Do you want to send your message anyway?`}
                    </Alert>
                </ComposerInnerModal>
            )}
        </>
    );
};

export default ComposerInnerModals;
