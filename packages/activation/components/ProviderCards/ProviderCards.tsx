import { c } from 'ttag';

import { ImportType } from '@proton/activation/interface';
import { useUser } from '@proton/components/hooks';

import { startImapDraft } from '../../logic/draft/imapDraft/imapDraft.actions';
import { startOauthDraft } from '../../logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '../../logic/store';
import { ImportProvider } from '../../logic/types/shared.types';
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
                />

                <ProviderCard
                    provider={ImportProvider.YAHOO}
                    onClick={() => dispatch(startImapDraft({ provider: ImportProvider.YAHOO }))}
                    disabled={disabled}
                    className="mb1 mr1"
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
                />

                <ProviderCard
                    provider={ImportProvider.DEFAULT}
                    onClick={() => dispatch(startImapDraft({ provider: ImportProvider.DEFAULT }))}
                    disabled={disabled}
                    className="mb1"
                />
            </div>
        </>
    );
};

export default ProviderCards;
