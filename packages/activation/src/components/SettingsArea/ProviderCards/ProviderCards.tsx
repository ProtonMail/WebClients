import { c } from 'ttag';

import { ImportProvider, ImportType, NEW_EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { startImapDraft } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { startOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { FeatureCode } from '@proton/components';
import { useFeature, useUser } from '@proton/components/hooks';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';

import ProviderCard from './ProviderCard';

const { ACCOUNT_WEB_SETTINGS, CALENDAR_WEB_SETTINGS } = NEW_EASY_SWITCH_SOURCES;

const ProviderCards = () => {
    const appFromPathname = getAppFromPathnameSafe(location.pathname);
    const dispatch = useEasySwitchDispatch();
    const [user, loadingUser] = useUser();
    const isLoading = loadingUser;
    const disabled = isLoading || !user.hasNonDelinquentScope;

    const easySwitchFeature = useFeature(FeatureCode.EasySwitch);

    const handleGoogleClick = () => {
        dispatch(
            startOauthDraft({
                source: appFromPathname === APPS.PROTONMAIL ? ACCOUNT_WEB_SETTINGS : CALENDAR_WEB_SETTINGS,
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
                                source: NEW_EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS,
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
