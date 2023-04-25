import { c } from 'ttag';

import { ImportProvider, ImportType } from '@proton/activation/src/interface';
import { startImapDraft } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { startOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { FeatureCode } from '@proton/components';
import { useFeature, useUser } from '@proton/components/hooks';

import ProviderCard from './ProviderCard';

const ProviderCards = () => {
    const dispatch = useEasySwitchDispatch();
    const [user, loadingUser] = useUser();
    const isLoading = loadingUser;
    const disabled = isLoading || !user.hasNonDelinquentScope;

    const easySwitchFeature = useFeature(FeatureCode.EasySwitch);

    const handleGoogleClick = () => {
        dispatch(
            startOauthDraft({
                provider: ImportProvider.GOOGLE,
                products: [ImportType.CONTACTS, ImportType.CALENDAR, ImportType.MAIL],
            })
        );
    };

    return (
        <>
            <div className="mb-4 text-bold">{c('Info').t`Select a service provider to start`}</div>
            <div className="mt-2">
                <ProviderCard
                    loading={easySwitchFeature.loading}
                    provider={ImportProvider.GOOGLE}
                    onClick={handleGoogleClick}
                    disabled={disabled}
                    className="mb-4 mr-4"
                    data-testid="ProviderCard:googleCard"
                />

                <ProviderCard
                    provider={ImportProvider.YAHOO}
                    onClick={() => dispatch(startImapDraft({ provider: ImportProvider.YAHOO }))}
                    disabled={disabled}
                    className="mb-4 mr-4"
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
                    className="mb-4 mr-4"
                    data-testid="ProviderCard:outlookCard"
                />

                <ProviderCard
                    provider={ImportProvider.DEFAULT}
                    onClick={() => dispatch(startImapDraft({ provider: ImportProvider.DEFAULT }))}
                    disabled={disabled}
                    className="mb-4"
                    data-testid="ProviderCard:imapCard"
                />
            </div>
        </>
    );
};

export default ProviderCards;
