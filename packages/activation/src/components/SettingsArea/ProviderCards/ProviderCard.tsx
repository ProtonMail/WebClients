import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import type { Location } from 'history';
import { c } from 'ttag';

import { ProductSelectionModal } from '@proton/activation/src/components/Modals/ProductSelectionModal/ProductSelectionModal';
import ConnectGmailButton from '@proton/activation/src/components/SettingsArea/ConnectGmailButton';
import { EASY_SWITCH_SEARCH_SOURCES, EASY_SWITCH_SOURCES, ImportProvider } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms/Button/Button';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
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
    const [, loadingCalendars] = useCalendars();

    const [selectedProvider, setSelectedProvider] = useState<ImportProvider>(ImportProvider.GOOGLE);
    const location = useLocation();

    const source = getEasySwitchSource(app, location);

    const [importModalProps, setImportModalOpen, renderImportModal] = useModalState();

    const handleOpenSelectionModal = (provider: ImportProvider) => {
        setSelectedProvider(provider);
        setImportModalOpen(true);
    };

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
                    onClick={() => handleOpenSelectionModal(ImportProvider.YAHOO)}
                    className="mb-2 inline-flex items-center justify-center rounded-lg"
                    data-testid="ProviderButton:yahooCard"
                    disabled={loadingCalendars}
                />

                <ProviderButton
                    provider={ImportProvider.OUTLOOK}
                    onClick={() => handleOpenSelectionModal(ImportProvider.OUTLOOK)}
                    className="mb-2 inline-flex items-center justify-center rounded-lg"
                    data-testid="ProviderButton:outlookCard"
                    disabled={loadingCalendars}
                />
            </div>
            <div>
                <Button
                    shape="underline"
                    color="norm"
                    onClick={() => handleOpenSelectionModal(ImportProvider.GOOGLE)}
                    data-testid="ProviderButton:advancedImport"
                    disabled={loadingCalendars}
                >
                    {c('Import provider').t`Advanced import`}
                </Button>
            </div>

            {renderImportModal && (
                <ProductSelectionModal source={source} provider={selectedProvider} {...importModalProps} />
            )}
        </div>
    );
};

export default ProviderCard;
