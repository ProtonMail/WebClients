import { useEffect } from 'react';

import {
    displayConfirmLeaveModal,
    initImapMailImport,
    resetImapDraft,
} from '@proton/activation/logic/draft/imapDraft/imapDraft.actions';
import {
    selectImapDraftMailConfirmModalDisplay,
    selectImapDraftMailImportStep,
} from '@proton/activation/logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/logic/store';

import ConfirmLeaveModal from '../../ConfirmLeaveModal/ConfirmLeaveModal';
import StepForm from './StepForm/StepForm';
import StepImporting from './StepImporting/StepImporting';
import StepPrepare from './StepPrepareImap/StepPrepareImap';

const ImapMailModal = () => {
    const confirmLeave = useEasySwitchSelector(selectImapDraftMailConfirmModalDisplay);
    const dispatch = useEasySwitchDispatch();
    const step = useEasySwitchSelector(selectImapDraftMailImportStep);

    useEffect(() => {
        if (step === undefined) {
            dispatch(initImapMailImport());
        }
    }, []);

    const handleClose = () => {
        dispatch(resetImapDraft());
    };
    const handleContinue = () => {
        dispatch(displayConfirmLeaveModal(false));
    };

    return (
        <>
            {confirmLeave && <ConfirmLeaveModal handleClose={handleClose} handleContinue={handleContinue} />}
            {step && ['form', 'reconnect-form'].includes(step) && <StepForm />}
            {step === 'prepare-import' && <StepPrepare />}
            {step === 'importing' && <StepImporting />}
        </>
    );
};

export default ImapMailModal;
