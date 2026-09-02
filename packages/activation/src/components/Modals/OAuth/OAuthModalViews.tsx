import { type ComponentType, useMemo } from 'react';

import type { ImportProvider, ImportType } from '../../../interface';
import {
    selectOauthDraftProvider,
    selectOauthImportStateProducts,
} from '../../../logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchSelector } from '../../../logic/store';
import ConfirmLeaveModal from '../ConfirmLeaveModal/ConfirmLeaveModal';
import StepInstructionsGoogle from './StepInstructions/StepInstructionsGoogle';
import StepLoadingImporter from './StepLoading/StepLoadingImporter';
import StepLoadingImporting from './StepLoading/StepLoadingImporting';
import StepPrepare from './StepPrepareOAuth/StepPrepareOAuth';
import StepSuccess from './StepSuccess/StepSuccess';

export interface OAuthModalViews {
    LoadingImporter: ComponentType<{ onClose?: () => void }>;
    Instructions: ComponentType<{ triggerOAuth: (scopes?: string[]) => void }>;
    Prepare: ComponentType;
    LoadingImporting: ComponentType;
    Success: ComponentType;
    ConfirmLeave: ComponentType<{ handleClose: () => void; handleContinue: () => void }>;
}

export const DEFAULT_OAUTH_MODAL_VIEWS: OAuthModalViews = {
    LoadingImporter: StepLoadingImporter,
    Instructions: StepInstructionsGoogle,
    Prepare: StepPrepare,
    LoadingImporting: StepLoadingImporting,
    Success: StepSuccess,
    ConfirmLeave: ConfirmLeaveModal,
};

export interface OAuthDraftSummary {
    provider?: ImportProvider;
    products?: ImportType[];
}

/**
 * Lets a caller swap in product-specific views (e.g. Drive's) for the drafts it recognises,
 * so the shared OAuth flow stays free of per-product branching. Views not listed here keep
 * their default.
 */
export interface OAuthModalViewsOverride {
    matches: (draft: OAuthDraftSummary) => boolean;
    views: Partial<OAuthModalViews>;
}

export const useOAuthModalViews = (override?: OAuthModalViewsOverride): OAuthModalViews => {
    const provider = useEasySwitchSelector(selectOauthDraftProvider);
    const products = useEasySwitchSelector(selectOauthImportStateProducts);

    return useMemo(() => {
        if (!override?.matches({ provider, products })) {
            return DEFAULT_OAUTH_MODAL_VIEWS;
        }
        return { ...DEFAULT_OAUTH_MODAL_VIEWS, ...override.views };
    }, [override, provider, products]);
};
