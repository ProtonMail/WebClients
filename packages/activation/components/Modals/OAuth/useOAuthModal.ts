import { c } from 'ttag';

import useAvailableAddresses from '@proton/activation/hooks/useAvailableAddresses';
import useOAuthPopup from '@proton/activation/hooks/useOAuthPopup';
import { EASY_SWITCH_SOURCE, OAuthProps } from '@proton/activation/interface';
import { createImporterThunk } from '@proton/activation/logic/draft/oauthDraft/createImporter.action';
import { changeOAuthStep } from '@proton/activation/logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthImportStateScopes,
} from '@proton/activation/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/logic/store';
import {
    FeatureCode,
    useAddresses,
    useCalendars,
    useFeature,
    useFolders,
    useLabels,
    useUser,
} from '@proton/components';

const useOAuthModal = () => {
    const [user] = useUser();
    const { defaultAddress } = useAvailableAddresses();

    const dispatch = useEasySwitchDispatch();

    const scopes = useEasySwitchSelector(selectOauthImportStateScopes);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);
    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your import will not be processed.`,
    });

    // Initial loading of all required data at later stage, ensure everything is loaded ahead of time
    const easySwitchFeature = useFeature(FeatureCode.EasySwitch);
    const [, loadingAddresses] = useAddresses();
    const [, loadingLabels] = useLabels();
    const [, loadingFolders] = useFolders();
    const [, loadingCalendars] = useCalendars();
    const initialLoading =
        loadingAddresses || loadingCalendars || loadingFolders || loadingLabels || easySwitchFeature.loading;

    const triggerOAuth = (tempScopes?: string[]) => {
        const finalScopes = scopes?.join(' ') ?? tempScopes?.join(' ');
        if (!provider || !finalScopes) {
            return;
        }

        triggerOAuthPopup({
            provider,
            scope: finalScopes,
            callback: async (oAuthProps: OAuthProps) => {
                const source = EASY_SWITCH_SOURCE.EASY_SWITCH_SETTINGS;
                dispatch(changeOAuthStep('loading-importer'));
                await dispatch(createImporterThunk({ oAuthProps, source, user, defaultAddress }));
            },
        });
    };

    return { initialLoading, loadingConfig, triggerOAuth };
};

export default useOAuthModal;
