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

    return (
        <>
            {step === 'products' && initialLoading && <LoadingImporter onClose={handleClose} />}
            {step === 'instructions' && provider === ImportProvider.GOOGLE && (
                <Instructions triggerOAuth={triggerOAuth} />
            )}
            {step === 'loading-importer' && <LoadingImporter onClose={handleClose} />}
            {step === 'prepare-import' && <Prepare />}
            {step === 'importing' && <LoadingImporting />}
            {step === 'success' && <Success />}
            {confirmLeave && <ConfirmLeave handleClose={handleClose} handleContinue={handleContinue} />}
        </>
    );
};

export default OAuthModal;
