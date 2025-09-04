import { useLocation } from 'react-router-dom';

import type { Location } from 'history';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import {
    EASY_SWITCH_SEARCH_SOURCES,
    EASY_SWITCH_SOURCES,
    ImportProvider,
    ImportType,
} from '@proton/activation/src/interface';
import { startImapDraft } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { startOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { FeatureCode, useFeature } from '@proton/features';
import { APPS, type APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';

import ProviderButton from './ProviderButton';

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

const ProviderCard = ({ app }: { app: APP_NAMES }) => {
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
        <div className="rounded border max-w-custom px-6 py-5 flex flex-column flex-1 flex-nowrap w-full">
            <div className="h3 m-0 pt-0 mb-4 text-bold">{c('Info').t`One time import`}</div>
            <div className="mb-4 color-weak">{c('Info')
                .t`Bring your messages, contacts and calendars to ${BRAND_NAME}.`}</div>
            <div className="mt-2 flex flex-column flex-nowrap">
                <ProviderButton
                    loading={easySwitchFeature.loading}
                    provider={ImportProvider.GOOGLE}
                    onClick={handleGoogleClick}
                    disabled={disabled}
                    className="mb-2 inline-flex items-center justify-center"
                    data-testid="ProviderButton:googleCard"
                />

                <ProviderButton
                    provider={ImportProvider.YAHOO}
                    onClick={() => dispatch(startImapDraft({ provider: ImportProvider.YAHOO }))}
                    disabled={disabled}
                    className="mb-2 inline-flex items-center justify-center"
                    data-testid="ProviderButton:yahooCard"
                />

                <ProviderButton
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
                    className="mb-2 inline-flex items-center justify-center"
                    data-testid="ProviderButton:outlookCard"
                />

                <ProviderButton
                    provider={ImportProvider.DEFAULT}
                    onClick={() => dispatch(startImapDraft({ provider: ImportProvider.DEFAULT }))}
                    disabled={disabled}
                    className="mb-4 inline-flex items-center justify-center"
                    data-testid="ProviderButton:imapCard"
                />
            </div>
        </div>
    );
};

export default ProviderCard;
