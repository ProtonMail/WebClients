import { useEffect } from 'react';

import { initImapMailImport } from '@proton/activation/logic/draft/imapDraft/imapDraft.actions';
import {
    selectImapDraftMailConfirmModalDisplay,
    selectImapDraftMailImportStep,
} from '@proton/activation/logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/logic/store';

import ConfirmLeaveModal from './ConfirmLeaveModal';
import StepForm from './StepForm/StepForm';
import StepImporting from './StepImporting/StepImporting';
import StepPrepare from './StepPrepare/StepPrepare';

const ImapMailModal = () => {
    const confirmLeave = useEasySwitchSelector(selectImapDraftMailConfirmModalDisplay);
    const dispatch = useEasySwitchDispatch();
    const step = useEasySwitchSelector(selectImapDraftMailImportStep);

    useEffect(() => {
        if (step === undefined) {
            dispatch(initImapMailImport());
        }
    }, []);

    return (
        <>
            {confirmLeave && <ConfirmLeaveModal />}
            {step && ['form', 'reconnect-form'].includes(step) && <StepForm />}
            {step === 'prepare-import' && <StepPrepare />}
            {step === 'importing' && <StepImporting />}
        </>
    );
};

export default ImapMailModal;
