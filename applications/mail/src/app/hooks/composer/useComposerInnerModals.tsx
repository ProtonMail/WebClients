import { useEffect, useState } from 'react';

import { usePromise } from '../usePromise';

export enum ComposerInnerModalStates {
    None,
    Password,
    Expiration,
    ScheduleSend,
    InsertImage,
    DeleteDraft,
    NoRecipients,
    NoSubjects,
    NoAttachments,
}

interface UseComposerInnerModals {
    pendingFiles?: File[];
    handleCancelAddAttachment: () => void;
}

export const useComposerInnerModals = ({ pendingFiles, handleCancelAddAttachment }: UseComposerInnerModals) => {
    // Flag representing the presence of an inner modal on the composer
    const [innerModal, setInnerModal] = useState(ComposerInnerModalStates.None);

    // Keyword found in the email if the user seems to want to send an attachment but there is none
    const [attachmentsFoundKeyword, setAttachmentsFoundKeyword] = useState('');

    const sendPromise = usePromise<void>();

    useEffect(() => {
        if (pendingFiles && pendingFiles.length > 0) {
            setInnerModal(ComposerInnerModalStates.InsertImage);
        }
    }, [pendingFiles]);

    const handlePassword = () => {
        setInnerModal(ComposerInnerModalStates.Password);
    };
    const handleExpiration = () => {
        setInnerModal(ComposerInnerModalStates.Expiration);
    };
    const handleCloseInnerModal = () => {
        setInnerModal(ComposerInnerModalStates.None);
    };
    const handleDeleteDraft = () => {
        setInnerModal(ComposerInnerModalStates.DeleteDraft);
    };

    const handleNoRecipients = () => {
        setInnerModal(ComposerInnerModalStates.NoRecipients);
        return sendPromise.renew();
    };

    const handleNoSubjects = () => {
        setInnerModal(ComposerInnerModalStates.NoSubjects);
        return sendPromise.renew();
    };

    const handleNoAttachments = (keyword: string) => {
        setInnerModal(ComposerInnerModalStates.NoAttachments);
        setAttachmentsFoundKeyword(keyword);
        return sendPromise.renew();
    };

    const handleCloseInsertImageModal = () => {
        handleCancelAddAttachment();
        handleCloseInnerModal();
    };

    const handleSendAnyway = () => {
        sendPromise.resolver();
        handleCloseInnerModal();
    };

    const handleCancelSend = (error: string) => {
        sendPromise.rejecter(error);
        handleCloseInnerModal();
    };

    return {
        innerModal,
        setInnerModal,
        attachmentsFoundKeyword,
        handlePassword,
        handleExpiration,
        handleCloseInnerModal,
        handleDeleteDraft,
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments,
        handleCloseInsertImageModal,
        handleSendAnyway,
        handleCancelSend,
    };
};
