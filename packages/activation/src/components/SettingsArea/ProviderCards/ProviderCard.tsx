import { type ReactNode, useState } from 'react';
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
import clsx from '@proton/utils/clsx';

import ProviderButton from './ProviderButton';

const getEasySwitchSource = (location: Location, inputSource: EASY_SWITCH_SOURCES) => {
    const source = new URLSearchParams(location.search).get('source');
    if (source && source === EASY_SWITCH_SEARCH_SOURCES.CONTACT_IMPORT) {
        return EASY_SWITCH_SOURCES.CONTACT_WEB_IMPORT_BUTTON;
    }

    return inputSource;
};

interface Props {
    app: APP_NAMES;
    hasBorders?: boolean;
    header?: ReactNode;
    showAdvancedImport?: boolean;
    onComplete?: () => Promise<void>;
    onBYOEFlowStart?: () => void;
    source: EASY_SWITCH_SOURCES;
}

const ProviderCard = ({
    app,
    header,
    hasBorders = true,
    showAdvancedImport = true,
    onComplete,
    onBYOEFlowStart,
    source: inputSource,
}: Props) => {
    const [, loadingCalendars] = useCalendars();

    const [selectedProvider, setSelectedProvider] = useState<ImportProvider>(ImportProvider.GOOGLE);
    const location = useLocation();

    const source = getEasySwitchSource(location, inputSource);

    const [importModalProps, setImportModalOpen, renderImportModal] = useModalState();

    const handleOpenSelectionModal = (provider: ImportProvider) => {
        setSelectedProvider(provider);
        setImportModalOpen(true);
    };

    return (
        <div
            className={clsx([
                'flex flex-column flex-1 flex-nowrap w-full items-center',
                hasBorders && 'rounded-xl border pt-10 pb-8 border-weak bg-lowered',
            ])}
        >
            <div className="mb-4">{header ?? c('Info').t`Choose your service to connect with`}</div>
            <div className="flex flex-nowrap gap-2">
                {app === APPS.PROTONMAIL ? (
                    <ConnectGmailButton
                        className="mb-2 inline-flex items-center justify-center gap-2 rounded-lg"
                        showIcon
                        buttonText={c('Action').t`Google`}
                        onComplete={onComplete}
                        onBYOEFlowStart={onBYOEFlowStart}
                        source={source}
                    />
                ) : (
                    <ProviderButton
                        provider={ImportProvider.GOOGLE}
                        onClick={() => handleOpenSelectionModal(ImportProvider.GOOGLE)}
                        className="mb-2 inline-flex items-center justify-center rounded-lg"
                        data-testid="ProviderButton:googleCard"
                        disabled={loadingCalendars}
                    />
                )}

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
            {showAdvancedImport && (
                <Button
                    shape="underline"
                    color="norm"
                    onClick={() =>
                        handleOpenSelectionModal(
                            app === APPS.PROTONMAIL ? ImportProvider.GOOGLE : ImportProvider.DEFAULT
                        )
                    }
                    data-testid="ProviderButton:advancedImport"
                    disabled={loadingCalendars}
                >
                    {c('Import provider').t`More import options`}
                </Button>
            )}

            {renderImportModal && (
                <ProductSelectionModal
                    source={source}
                    provider={selectedProvider}
                    onComplete={onComplete}
                    {...importModalProps}
                />
            )}
        </div>
    );
};

export default ProviderCard;
