import { c } from 'ttag';

import { ImportType } from '@proton/activation/interface';
import { ImportProvider } from '@proton/activation/interface';
import { startImapDraft } from '@proton/activation/logic/draft/imapDraft/imapDraft.actions';
import { startOauthDraft } from '@proton/activation/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/logic/store';
import { useUser } from '@proton/components/hooks';

import ProviderCard from './ProviderCard';

const ProviderCards = () => {
    const dispatch = useEasySwitchDispatch();
    const [user, loadingUser] = useUser();
    const isLoading = loadingUser;
    const disabled = isLoading || !user.hasNonDelinquentScope;

    return (
        <>
            <div className="mb1 text-bold">{c('Info').t`Select a service provider to start`}</div>

            <div className="mt0-5">
                <ProviderCard
                    provider={ImportProvider.GOOGLE}
                    onClick={() => {
                        dispatch(
                            startOauthDraft({
                                provider: ImportProvider.GOOGLE,
                                products: [ImportType.CONTACTS, ImportType.CALENDAR, ImportType.MAIL],
                            })
                        );
                    }}
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
            </div>
        </>
    );
};

export default ProviderCards;
