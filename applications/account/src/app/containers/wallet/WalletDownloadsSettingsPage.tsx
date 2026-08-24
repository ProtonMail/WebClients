import { useUser } from '@proton/account/user/hooks';
import { useApi } from '@proton/app-context/useApi';
import { DownloadClientCard, SettingsSectionWide } from '@proton/components';
import { getTelemetryUserTier } from '@proton/components/helpers/getTelemetryUserTier';
import { mapTelemetryOsVersionWithStore } from '@proton/components/helpers/mapTelemetryOsVersionWithStore';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { APPS } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { WALLET_CLIENTS } from '@proton/wallet/constants/settings';

export const WalletDownloadsSettingsPage = () => {
    const api = useApi();
    const [user] = useUser();

    const handleDownloadClick = (destination: string) => {
        void sendTelemetryReport({
            api,
            delay: false,
            event: TelemetryAccountDashboardEvents.downloadCtaClick,
            measurementGroup: TelemetryMeasurementGroups.accountDashboard,
            dimensions: {
                app: APPS.PROTONWALLET,
                download_destination: mapTelemetryOsVersionWithStore(destination),
                user_tier: getTelemetryUserTier(user),
            },
        });
    };

    return (
        <SettingsSectionWide>
            <div className="flex gap-4 flex-column md:flex-row">
                {Object.values(WALLET_CLIENTS).map(({ title, icon, link, items }) => (
                    <div>
                        <DownloadClientCard
                            title={title}
                            icon={icon}
                            link={link}
                            items={items}
                            onClick={() => handleDownloadClick(title)}
                        />
                    </div>
                ))}
            </div>
        </SettingsSectionWide>
    );
};
