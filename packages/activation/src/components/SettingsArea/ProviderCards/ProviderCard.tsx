import { useLocation } from 'react-router-dom';

import type { Location } from 'history';
import { c } from 'ttag';

import ConnectGmailButton from '@proton/activation/src/components/SettingsArea/ConnectGmailButton';
import {
    EASY_SWITCH_SEARCH_SOURCES,
    EASY_SWITCH_SOURCES,
    ImportProvider,
    ImportType,
} from '@proton/activation/src/interface';
import { startImapDraft } from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import { startOauthDraft } from '@proton/activation/src/logic/draft/oauthDraft/oauthDraft.actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms/Button/Button';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';

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

interface Props {
    app: APP_NAMES;
}

const ProviderCard = ({ app }: Props) => {
    const location = useLocation();
    const dispatch = useEasySwitchDispatch();

    const source = getEasySwitchSource(app, location);

    return (
        <div className="rounded-xl border pt-10 pb-8 flex flex-column flex-1 flex-nowrap w-full items-center bg-lowered border-weak">
            <div className="mb-4">{c('Info').t`Choose your service to connect with`}</div>
            <div className="flex flex-nowrap gap-2">
                <ConnectGmailButton
                    className="mb-2 inline-flex items-center justify-center gap-2 rounded-lg"
                    showIcon
                    buttonText={c('Action').t`Google`}
                    data-testid="ProviderButton:googleCard"
                />

                <ProviderButton
                    provider={ImportProvider.YAHOO}
                    onClick={() => dispatch(startImapDraft({ provider: ImportProvider.YAHOO }))}
                    className="mb-2 inline-flex items-center justify-center rounded-lg"
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
                    className="mb-2 inline-flex items-center justify-center rounded-lg"
                    data-testid="ProviderButton:outlookCard"
                />
            </div>
            <div>
                <Button
                    shape="underline"
                    color="norm"
                    onClick={() => dispatch(startImapDraft({ provider: ImportProvider.DEFAULT }))}
                    data-testid="ProviderButton:imapCard"
                >
                    {c('Import provider').t`Advanced import`}
                </Button>
            </div>
        </div>
    );
};

export default ProviderCard;
