import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { getScopeFromProvider } from '@proton/activation/src/components/Modals/OAuth/OAuthModal.helpers';
import useAvailableAddresses from '@proton/activation/src/hooks/useAvailableAddresses';
import useOAuthPopup from '@proton/activation/src/hooks/useOAuthPopup';
import {
    type EASY_SWITCH_SOURCES,
    ImportProvider,
    type ImportType,
    type OAuthProps,
} from '@proton/activation/src/interface';
import { selectImapProduct, startImapDraft } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { createImporterThunk } from '@proton/activation/src/logic/draft/oauthDraft/createImporter.action';
import {
    changeOAuthStep,
    initOauthMailImport,
    startOauthDraft,
    submitProductProvider,
} from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';

export const useProductSelectionSubmit = () => {
    const [user] = useUser();
    const { availableAddresses } = useAvailableAddresses();

    const dispatch = useEasySwitchDispatch();

    const { triggerOAuthPopup, loadingConfig } = useOAuthPopup({
        errorMessage: c('Error').t`Your import will not be processed.`,
    });

    const handleSubmit = (provider: ImportProvider, products: ImportType[], source: EASY_SWITCH_SOURCES) => {
        const isOAuth = provider === ImportProvider.GOOGLE || provider === ImportProvider.OUTLOOK;

        if (isOAuth) {
            const scopes = getScopeFromProvider(provider, products);
            dispatch(startOauthDraft({ provider, products, source }));
            dispatch(initOauthMailImport());
            dispatch(submitProductProvider({ products, scopes }));

            if (provider === ImportProvider.GOOGLE) {
                dispatch(changeOAuthStep('instructions'));
                // OAuthModal takes over from here StepInstructionsGoogle will be shown
            }
            if (provider === ImportProvider.OUTLOOK) {
                dispatch(changeOAuthStep('loading-importer'));

                void triggerOAuthPopup({
                    provider,
                    scope: scopes.join(' '),
                    callback: async (oAuthProps: OAuthProps) => {
                        if (!availableAddresses?.length) {
                            throw new Error('Missing address');
                        }
                        await dispatch(createImporterThunk({ oAuthProps, source, user, availableAddresses }));
                    },
                });
            }
        } else {
            // IMAP (Yahoo / Default)
            dispatch(startImapDraft({ provider }));
            dispatch(selectImapProduct({ product: products[0] }));
            // MainModal picks up at 'read-instructions'
        }
    };

    return { handleSubmit, loadingConfig };
};
