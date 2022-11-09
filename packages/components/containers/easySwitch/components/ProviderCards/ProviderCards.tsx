import { c } from 'ttag';

import { useUser } from '@proton/components/hooks';

import { startDraft } from '../../logic/draft/draft.actions';
import { useEasySwitchDispatch } from '../../logic/store';
import { ImportAuthType, ImportProvider, ImportType } from '../../logic/types/shared.types';
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
                            startDraft({
                                provider: ImportProvider.GOOGLE,
                                authType: ImportAuthType.OAUTH,
                                importType: [ImportType.CONTACTS, ImportType.CALENDAR, ImportType.MAIL],
                            })
                        );
                    }}
                    disabled={disabled}
                    className="mb1 mr1"
                />

                <ProviderCard
                    provider={ImportProvider.YAHOO}
                    onClick={() =>
                        dispatch(startDraft({ provider: ImportProvider.YAHOO, authType: ImportAuthType.IMAP }))
                    }
                    disabled={disabled}
                    className="mb1 mr1"
                />

                <ProviderCard
                    provider={ImportProvider.OUTLOOK}
                    onClick={() =>
                        dispatch(
                            startDraft({
                                provider: ImportProvider.OUTLOOK,
                                authType: ImportAuthType.OAUTH,
                                importType: [ImportType.CONTACTS, ImportType.CALENDAR, ImportType.MAIL],
                            })
                        )
                    }
                    disabled={disabled}
                    className="mb1 mr1"
                />

                <ProviderCard
                    provider={ImportProvider.DEFAULT}
                    onClick={() =>
                        dispatch(startDraft({ provider: ImportProvider.DEFAULT, authType: ImportAuthType.IMAP }))
                    }
                    disabled={disabled}
                    className="mb1"
                />
            </div>
        </>
    );
};

export default ProviderCards;
