import type { ReactNode } from 'react';

import { ImportProvider } from '../../../interface';
import { displayConfirmLeaveModal, resetOauthDraft } from '../../../logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthDraftStepConfirmModalDisplay,
    selectOauthImportStateStep,
} from '../../../logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../../logic/store';
import type { OAuthModalViewsOverride } from './OAuthModalViews';
import { useOAuthModalViews } from './OAuthModalViews';
import useOAuthModal from './useOAuthModal';

interface Props {
    oauthViews?: OAuthModalViewsOverride;
}

const OAuthModal = ({ oauthViews }: Props) => {
    const dispatch = useEasySwitchDispatch();

    const step = useEasySwitchSelector(selectOauthImportStateStep);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);
    const confirmLeave = useEasySwitchSelector(selectOauthDraftStepConfirmModalDisplay);

    const { triggerOAuth, initialLoading } = useOAuthModal();
    const { LoadingImporter, Instructions, Prepare, LoadingImporting, Success, ConfirmLeave } =
        useOAuthModalViews(oauthViews);

    const handleClose = () => {
        dispatch(resetOauthDraft());
    };

    const handleContinue = () => {
        dispatch(displayConfirmLeaveModal(false));
    };

    /**
     * All steps render into this single variable (instead of using one `{step === 'x' && ...}`
     * line per step) so that a custom view override pointing two steps at the same component
     * keeps that component mounted when moving between them. With separate JSX lines, each is
     * a distinct slot in the tree, so switching steps would unmount and remount the component
     * even though it's the same component.
     */

    let stepView: ReactNode = null;
    if (step === 'products' && initialLoading) {
        stepView = <LoadingImporter onClose={handleClose} />;
    } else if (step === 'instructions' && provider === ImportProvider.GOOGLE) {
        stepView = <Instructions triggerOAuth={triggerOAuth} />;
    } else if (step === 'loading-importer') {
        stepView = <LoadingImporter onClose={handleClose} />;
    } else if (step === 'prepare-import') {
        stepView = <Prepare />;
    } else if (step === 'importing') {
        stepView = <LoadingImporting />;
    } else if (step === 'success') {
        stepView = <Success />;
    }

    return (
        <>
            {stepView}
            {confirmLeave && <ConfirmLeave handleClose={handleClose} handleContinue={handleContinue} />}
        </>
    );
};

export default OAuthModal;
