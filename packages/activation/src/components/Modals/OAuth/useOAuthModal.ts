import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';

import useAvailableAddresses from '../../../hooks/useAvailableAddresses';
import useOAuthPopup from '../../../hooks/useOAuthPopup';
import { getEasySwitchFeaturesFromProducts } from '../../../hooks/useOAuthPopup.helpers';
import type { OAuthProps } from '../../../interface';
import { EASY_SWITCH_SOURCES, ImportProvider } from '../../../interface';
import { createImporterThunk } from '../../../logic/draft/oauthDraft/createImporter.action';
import { changeOAuthStep } from '../../../logic/draft/oauthDraft/oauthDraft.actions';
import {
    selectOauthDraftProvider,
    selectOauthDraftSource,
    selectOauthImportStateProducts,
    selectOauthImportStateScopes,
} from '../../../logic/draft/oauthDraft/oauthDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '../../../logic/store';

const useOAuthModal = () => {
    const [user] = useUser();
    const { availableAddresses } = useAvailableAddresses();

    const dispatch = useEasySwitchDispatch();
    const storeSource = useEasySwitchSelector(selectOauthDraftSource);

    const scopes = useEasySwitchSelector(selectOauthImportStateScopes);
    const provider = useEasySwitchSelector(selectOauthDraftProvider);
    const products = useEasySwitchSelector(selectOauthImportStateProducts);
    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your import will not be processed.`,
    });

    // Initial loading of all required data at later stage, ensure everything is loaded ahead of time
    const [, loadingAddresses] = useAddresses();
    const [, loadingLabels] = useLabels();
    const [, loadingFolders] = useFolders();
    const [, loadingCalendars] = useCalendars();
    const initialLoading = loadingAddresses || loadingCalendars || loadingFolders || loadingLabels;

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
                if (!availableAddresses?.length) {
                    throw new Error('Missing address');
                }
                const source = storeSource ?? EASY_SWITCH_SOURCES.UNKNOWN;
                dispatch(changeOAuthStep('loading-importer'));
                await dispatch(createImporterThunk({ oAuthProps, source, user, availableAddresses }));
            },
        });
    };

    return { initialLoading, loadingConfig, triggerOAuth };
};

export default useOAuthModal;
