import { type ComponentType, type ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';

import type { Location } from 'history';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import B2BOnboardingFeatureItem from '@proton/components/components/onboarding/b2b/B2BOnboardingFeatureItem';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { type ProviderDisplay, providerMap } from '../../../constants';
import { EASY_SWITCH_SEARCH_SOURCES, EASY_SWITCH_SOURCES, ImportProvider } from '../../../interface';
import { getOrganizationMigrationFeatures } from '../../../oles/migrationFeatures';
import { OLES_PROVIDERS, getProviderRouteSlug } from '../../../oles/providers';
import useOLESFeatureStatus from '../../../oles/useOLESFeatureStatus';
import { ProductSelectionModal } from '../../Modals/ProductSelectionModal/ProductSelectionModal';
import ConnectGmailButton from '../ConnectGmailButton';
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
    /**
     * Lets a caller (e.g. Drive's settings, behind its own flag) replace the default
     * provider/product selector entirely with its own entry screen. ProviderCard doesn't need
     * to know who's overriding it or why — it just renders whatever it's given.
     */
    entryView?: ComponentType<{ source: EASY_SWITCH_SOURCES }>;
}

const ProviderCard = ({
    app,
    header,
    hasBorders = true,
    showAdvancedImport = true,
    onComplete,
    onBYOEFlowStart,
    source: inputSource,
    entryView: EntryView,
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
            const isProviderEnabled = olesFeatureStatus.isProviderEnabled(provider);

            // For OLES-supported providers, only administrators can use Org-Level Easy Switch
            if (isProviderEnabled && !olesFeatureStatus.allowedForUser) {
                return createNotification({
                    text: c('Error').t`Contact your administrator to start a migration.`,
                });
            }

            // Expand ProviderCard with features for unsupported providers
            if (!isProviderEnabled && olesFeatureStatus.allowedForUser) {
                setSelectedProvider(provider);
                return setShowFeatures(true);
            }

            // Provider buttons can only open the Org-Level Easy Switch assistant
            // if the org is OLES-eligible (roughly translates to being on a B2B plan),
            // and if the feature is not soft (client FF) or fully (backend FF) disabled
            if (isProviderEnabled && olesFeatureStatus.allowedForUser) {
                return goToSettings(`/easy-switch/migration-assistant?provider=${getProviderRouteSlug(provider)}`);
            }
        }

        handleOpenSelectionModal(provider);
    };

    const organizationMigrationFeatures = getOrganizationMigrationFeatures({
        onEasySwitchClick: () => handleOpenSelectionModal(selectedProvider),
    });

    const renderProviderButtons = (): ReactNode => {
        // Wait for the OLES status before committing to an order/branding, otherwise the row would
        // flash from the default layout to the Microsoft one once the org data resolves.
        if (olesFeatureStatus.loading) {
            return (
                <div className="flex flex-nowrap gap-2">
                    {[0, 1, 2].map((index) => (
                        <SkeletonLoader key={index} width="7rem" height="2.25rem" className="mb-2 rounded-lg" />
                    ))}
                </div>
            );
        }

        // In a B2B/OLES context with Outlook migrations enabled, Outlook is presented as "Microsoft"
        // and moved ahead of Yahoo. Clicks still resolve the OLES-vs-normal flow via handleProviderChoice.
        const outlookAsMicrosoft =
            olesFeatureStatus.creatingEnabled && olesFeatureStatus.isProviderEnabled(ImportProvider.OUTLOOK);

        const microsoftDisplay: ProviderDisplay = {
            ...providerMap[ImportProvider.OUTLOOK],
            getName: () => OLES_PROVIDERS[ImportProvider.OUTLOOK].brandName,
            logo: OLES_PROVIDERS[ImportProvider.OUTLOOK].iconSrc,
        };

        const order = outlookAsMicrosoft
            ? [ImportProvider.GOOGLE, ImportProvider.OUTLOOK, ImportProvider.YAHOO]
            : [ImportProvider.GOOGLE, ImportProvider.YAHOO, ImportProvider.OUTLOOK];

        const buttonClassName = 'mb-2 inline-flex items-center justify-center rounded-lg';

        const renderButton = (provider: ImportProvider) => {
            switch (provider) {
                case ImportProvider.GOOGLE:
                    // In Mail, without Org-Level Easy Switch, Google opens the BYOE / auto-forwarding flow.
                    return app === APPS.PROTONMAIL && !olesFeatureStatus.creatingEnabled ? (
                        <ConnectGmailButton
                            key={provider}
                            className={clsx(buttonClassName, 'gap-2')}
                            showIcon
                            buttonText={c('Action').t`Google`}
                            onComplete={onComplete}
                            onBYOEFlowStart={onBYOEFlowStart}
                            source={source}
                        />
                    ) : (
                        <ProviderButton
                            key={provider}
                            provider={providerMap[ImportProvider.GOOGLE]}
                            onClick={() => handleProviderChoice(ImportProvider.GOOGLE)}
                            className={buttonClassName}
                            data-testid="ProviderButton:googleCard"
                            disabled={loadingCalendars}
                        />
                    );
                case ImportProvider.YAHOO:
                    return (
                        <ProviderButton
                            key={provider}
                            provider={providerMap[ImportProvider.YAHOO]}
                            onClick={() => handleProviderChoice(ImportProvider.YAHOO)}
                            className={buttonClassName}
                            data-testid="ProviderButton:yahooCard"
                            disabled={loadingCalendars}
                        />
                    );
                case ImportProvider.OUTLOOK:
                    return (
                        <ProviderButton
                            key={provider}
                            provider={outlookAsMicrosoft ? microsoftDisplay : providerMap[ImportProvider.OUTLOOK]}
                            onClick={() => handleProviderChoice(ImportProvider.OUTLOOK)}
                            className={buttonClassName}
                            data-testid="ProviderButton:outlookCard"
                            disabled={loadingCalendars}
                        />
                    );
                default:
                    return null;
            }
        };

        return <div className="flex flex-nowrap gap-2">{order.map(renderButton)}</div>;
    };

    const renderContent = (): ReactNode => {
        if (showFeatures) {
            return (
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
            );
        }

        return (
            <>
                <div className="mb-4">{header ?? c('Info').t`Choose your service to connect with`}</div>
                {EntryView ? <EntryView source={source} /> : renderProviderButtons()}
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
        );
    };

    return (
        <div
            className={clsx([
                'flex flex-column flex-1 flex-nowrap w-full items-center',
                hasBorders && 'rounded-xl border pt-10 pb-8 border-weak bg-lowered',
            ])}
        >
            {renderContent()}

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
