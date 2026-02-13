import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import useAvailableAddresses from '@proton/activation/src/hooks/useAvailableAddresses';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import { getEasySwitchFeaturesFromProducts } from '@proton/activation/src/hooks/useOAuthPopup.helpers';
import type { OAuthProps } from '@proton/activation/src/interface';
import { EASY_SWITCH_SOURCES, ImportProvider } from '@proton/activation/src/interface';
import { createImporterThunk } from '@proton/activation/src/logic/draft/oauthDraft/createImporter.action';
import { changeOAuthStep } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthDraftSource,
    selectOauthImportStateProducts,
    selectOauthImportStateScopes,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { FeatureCode, useFeature } from '@proton/features';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';

const useOAuthModal = () => {
    const [user] = useUser();
    const { defaultAddress } = useAvailableAddresses();

    const dispatch = useEasySwitchDispatch();
    const storeSource = useEasySwitchSelector(selectOauthDraftSource);

    const scopes = useEasySwitchSelector(selectOauthImportStateScopes);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);
    const products = useEasySwitchSelector(selectOauthImportStateProducts);
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
        // Early return if we cannot continue, however we don't need scopes for Google oAuth
        if (!provider || (!finalScopes && provider !== ImportProvider.GOOGLE)) {
            return;
        }

        const features = getEasySwitchFeaturesFromProducts(products || []);

        void triggerOAuthPopup({
            provider,
            scope: finalScopes || '',
            features,
            callback: async (oAuthProps: OAuthProps) => {
                if (!defaultAddress) {
                    throw new Error('Missing address');
                }
                const source = storeSource ?? EASY_SWITCH_SOURCES.UNKNOWN;
                dispatch(changeOAuthStep('loading-importer'));
                await dispatch(createImporterThunk({ oAuthProps, source, user, defaultAddress }));
            },
        });
    };

    return { initialLoading, loadingConfig, triggerOAuth };
};

export default useOAuthModal;
