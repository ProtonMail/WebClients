import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';

import useAvailableAddresses from '../../../hooks/useAvailableAddresses';
import useOAuthPopup from '../../../hooks/useOAuthPopup';
import { type EASY_SWITCH_SOURCES, ImportProvider, type ImportType, type OAuthProps } from '../../../interface';
import { selectImapProduct, startImapDraft } from '../../../logic/draft/imapDraft/imapDraft.actions';
import { createImporterThunk } from '../../../logic/draft/oauthDraft/createImporter.action';
import {
    changeOAuthStep,
    initOauthMailImport,
    startOauthDraft,
    submitProductProvider,
} from '../../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../../logic/store';
import { getScopeFromProvider } from '../OAuth/OAuthModal.helpers';

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
