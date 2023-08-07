import { useEffect } from 'react';

import { ImportProvider } from '@proton/activation/src/interface';
import {
    displayConfirmLeaveModal,
    initOauthMailImport,
    resetOauthDraft,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthDraftStepConfirmModalDisplay,
    selectOauthImportStateStep,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';

import ConfirmLeaveModal from '../ConfirmLeaveModal/ConfirmLeaveModal';
import StepInstructionsGoogle from './StepInstructions/StepInstructionsGoogle';
import StepLoadingImporter from './StepLoading/StepLoadingImporter';
import StepLoadingImporting from './StepLoading/StepLoadingImporting';
import StepPrepare from './StepPrepareOAuth/StepPrepareOAuth';
import StepProducts from './StepProducts/StepProducts';
import StepSuccess from './StepSuccess/StepSuccess';
import useOAuthModal from './useOAuthModal';

const OAuthModal = () => {
    const dispatch = useEasySwitchDispatch();

    const step = useEasySwitchSelector(selectOauthImportStateStep);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);
    const confirmLeave = useEasySwitchSelector(selectOauthDraftStepConfirmModalDisplay);

    const { triggerOAuth, initialLoading } = useOAuthModal();

    useEffect(() => {
        if (step === undefined) {
            dispatch(initOauthMailImport());
        }
    }, []);

    const handleClose = () => {
        dispatch(resetOauthDraft());
    };

    const handleContinue = () => {
        dispatch(displayConfirmLeaveModal(false));
    };

    return (
        <>
            {step === 'products' && initialLoading && <StepLoadingImporter />}
            {step === 'products' && !initialLoading && <StepProducts triggerOAuth={triggerOAuth} />}
            {step === 'instructions' && provider === ImportProvider.GOOGLE && (
                <StepInstructionsGoogle triggerOAuth={triggerOAuth} />
            )}
            {step === 'loading-importer' && <StepLoadingImporter />}
            {step === 'prepare-import' && <StepPrepare />}
            {step === 'importing' && <StepLoadingImporting />}
            {step === 'success' && <StepSuccess />}
            {confirmLeave && <ConfirmLeaveModal handleClose={handleClose} handleContinue={handleContinue} />}
        </>
    );
};

export default OAuthModal;
