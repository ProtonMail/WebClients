import { c } from 'ttag';

import { ImportProvider, ImportType } from '@proton/activation/interface';
import { startImapDraft } from '@proton/activation/logic/draft/imapDraft/imapDraft.actions';
import { startOauthDraft } from '@proton/activation/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/logic/store';
import { useFeature, useUser } from '@proton/components/hooks';
import { FeatureCode, useModalState } from '@proton/components/index';

import OAuthImportSelectionModal from '../../Modals/OAuthImportSelectionModal/OAuthImportSelectionModal';
import ProviderCard from './ProviderCard';

const ProviderCards = () => {
    const dispatch = useEasySwitchDispatch();
    const [user, loadingUser] = useUser();
    const isLoading = loadingUser;
    const disabled = isLoading || !user.hasNonDelinquentScope;

    const gmailSync = useFeature(FeatureCode.EasySwitchGmailSync);

    const [oauthSelectionProps, setOAuthSelectionVisibility, renderOAuthSelection] = useModalState();

    const handleGoogleClick = () => {
        if (gmailSync.loading) {
            return;
        }

        if (gmailSync.feature && gmailSync.feature.Value) {
            setOAuthSelectionVisibility(true);
        } else {
            dispatch(
                startOauthDraft({
                    provider: ImportProvider.GOOGLE,
                    products: [ImportType.CONTACTS, ImportType.CALENDAR, ImportType.MAIL],
                })
            );
        }
    };

    return (
        <>
            <div className="mb1 text-bold">{c('Info').t`Select a service provider to start`}</div>

            <div className="mt0-5">
                <ProviderCard
                    loading={gmailSync.loading}
                    provider={ImportProvider.GOOGLE}
                    onClick={handleGoogleClick}
                    disabled={disabled}
                    className="mb1 mr1"
                    data-testid="ProviderCard:googleCard"
                />

                <ProviderCard
                    provider={ImportProvider.YAHOO}
                    onClick={() => dispatch(startImapDraft({ provider: ImportProvider.YAHOO }))}
                    disabled={disabled}
                    className="mb1 mr1"
                    data-testid="ProviderCard:yahooCard"
                />

                <ProviderCard
                    provider={ImportProvider.OUTLOOK}
                    onClick={() =>
                        dispatch(
                            startOauthDraft({
                                provider: ImportProvider.OUTLOOK,
                                products: [ImportType.CONTACTS, ImportType.CALENDAR, ImportType.MAIL],
                            })
                        )
                    }
                    disabled={disabled}
                    className="mb1 mr1"
                    data-testid="ProviderCard:outlookCard"
                />

                <ProviderCard
                    provider={ImportProvider.DEFAULT}
                    onClick={() => dispatch(startImapDraft({ provider: ImportProvider.DEFAULT }))}
                    disabled={disabled}
                    className="mb1"
                    data-testid="ProviderCard:imapCard"
                />

                {renderOAuthSelection && gmailSync.feature?.Value && (
                    <OAuthImportSelectionModal
                        modalProps={oauthSelectionProps}
                        onClose={() => setOAuthSelectionVisibility(false)}
                    />
                )}
            </div>
        </>
    );
};

export default ProviderCards;
