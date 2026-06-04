import { type ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';

import type { Location } from 'history';
import { c } from 'ttag';

import { ProductSelectionModal } from '@proton/activation/src/components/Modals/ProductSelectionModal/ProductSelectionModal';
import ConnectGmailButton from '@proton/activation/src/components/SettingsArea/ConnectGmailButton';
import { EASY_SWITCH_SEARCH_SOURCES, EASY_SWITCH_SOURCES, ImportProvider } from '@proton/activation/src/interface';
import { isProviderSupported } from '@proton/activation/src/oles/eligibility';
import { getOrganizationMigrationFeatures } from '@proton/activation/src/oles/migrationFeatures';
import useOLESFeatureStatus from '@proton/activation/src/oles/useOLESFeatureStatus';
import { Button } from '@proton/atoms/Button/Button';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import B2BOnboardingFeatureItem from '@proton/components/components/onboarding/b2b/B2BOnboardingFeatureItem';
import { useNotifications } from '@proton/components/index';
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
    const { createNotification } = useNotifications();

    const [selectedProvider, setSelectedProvider] = useState<ImportProvider>(ImportProvider.GOOGLE);
    const location = useLocation();

    const source = getEasySwitchSource(location, inputSource);

    const [importModalProps, setImportModalOpen, renderImportModal] = useModalState();

    const olesFeatureStatus = useOLESFeatureStatus();
    const [showFeatures, setShowFeatures] = useState(false);
    const goToSettings = useSettingsLink();

    const handleOpenSelectionModal = (provider: ImportProvider) => {
        setSelectedProvider(provider);
        setImportModalOpen(true);
    };

    const handleProviderChoice = (provider: ImportProvider) => {
        // Org-Level Easy Switch takes precedence over both BYOE
        // and normal ES imports for supported providers
        if (olesFeatureStatus.creatingEnabled) {
            // For OLES-supported providers, only administrators can use Org-Level Easy Switch
            if (isProviderSupported(provider) && !olesFeatureStatus.allowedForUser) {
                return createNotification({
                    text: c('BOSS').t`Contact your administrator to start a migration.`,
                });
            }

            // Expand ProviderCard with features for unsupported providers
            if (!isProviderSupported(provider) && olesFeatureStatus.allowedForUser) {
                setSelectedProvider(provider);
                return setShowFeatures(true);
            }

            // Provider buttons can only open the Org-Level Easy Switch assistant
            // if the org is OLES-eligible (roughly translates to being on a B2B plan),
            // and if the feature is not soft (client FF) or fully (backend FF) disabled
            if (isProviderSupported(provider) && olesFeatureStatus.allowedForUser) {
                return goToSettings('/easy-switch/migration-assistant');
            }
        }

        handleOpenSelectionModal(provider);
    };

    const organizationMigrationFeatures = getOrganizationMigrationFeatures({
        onEasySwitchClick: () => handleOpenSelectionModal(selectedProvider),
    });

    return (
        <div
            className={clsx([
                'flex flex-column flex-1 flex-nowrap w-full items-center',
                hasBorders && 'rounded-xl border pt-10 pb-8 border-weak bg-lowered',
            ])}
        >
            {showFeatures ? (
                <>
                    <Button
                        shape="underline"
                        color="norm"
                        onClick={() => setShowFeatures(false)}
                        className="mb-2"
                        data-testid="ProviderCard:back"
                    >
                        {c('Action').t`Back`}
                    </Button>

                    <ul className="unstyled mt-0">
                        {organizationMigrationFeatures.map((feature) => (
                            <li key={feature.id}>
                                <B2BOnboardingFeatureItem feature={feature} />
                            </li>
                        ))}
                    </ul>
                </>
            ) : (
                <>
                    <div className="mb-4">{header ?? c('Info').t`Choose your service to connect with`}</div>
                    <div className="flex flex-nowrap gap-2">
                        {/* Google */}
                        {app === APPS.PROTONMAIL && !olesFeatureStatus.creatingEnabled ? (
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
                                onClick={() => handleProviderChoice(ImportProvider.GOOGLE)}
                                className="mb-2 inline-flex items-center justify-center rounded-lg"
                                data-testid="ProviderButton:googleCard"
                                disabled={loadingCalendars}
                            />
                        )}

                        <ProviderButton
                            provider={ImportProvider.YAHOO}
                            onClick={() => handleProviderChoice(ImportProvider.YAHOO)}
                            className="mb-2 inline-flex items-center justify-center rounded-lg"
                            data-testid="ProviderButton:yahooCard"
                            disabled={loadingCalendars}
                        />

                        <ProviderButton
                            provider={ImportProvider.OUTLOOK}
                            onClick={() => handleProviderChoice(ImportProvider.OUTLOOK)}
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
                </>
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
