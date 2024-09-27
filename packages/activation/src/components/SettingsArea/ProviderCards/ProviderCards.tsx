import { useLocation } from 'react-router-dom';

import type { Location } from 'history';
import { c } from 'ttag';

import {
    EASY_SWITCH_SEARCH_SOURCES,
    EASY_SWITCH_SOURCES,
    ImportProvider,
    ImportType,
} from '@proton/activation/src/interface';
import { startImapDraft } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { startOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { useUser } from '@proton/components/hooks';
import { FeatureCode, useFeature } from '@proton/features';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import ProviderCard from './ProviderCard';

const { ACCOUNT_WEB_SETTINGS, CALENDAR_WEB_SETTINGS, CONTACT_WEB_IMPORT_BUTTON } = EASY_SWITCH_SOURCES;

const getEasySwitchSource = (app: APP_NAMES, location: Location) => {
    const source = new URLSearchParams(location.search).get('source');
    if (source && source === EASY_SWITCH_SEARCH_SOURCES.CONTACT_IMPORT) {
        return CONTACT_WEB_IMPORT_BUTTON;
    }

    if (app === APPS.PROTONMAIL) {
        return ACCOUNT_WEB_SETTINGS;
    }

    return CALENDAR_WEB_SETTINGS;
};

const ProviderCards = ({ app }: { app: APP_NAMES }) => {
    const location = useLocation();
    const dispatch = useEasySwitchDispatch();
    const [user, loadingUser] = useUser();
    const isLoading = loadingUser;
    const disabled = isLoading || !user.hasNonDelinquentScope;

    const easySwitchFeature = useFeature(FeatureCode.EasySwitch);
    const source = getEasySwitchSource(app, location);

    const handleGoogleClick = () => {
        dispatch(
            startOauthDraft({
                source,
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
                                source: source,
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
