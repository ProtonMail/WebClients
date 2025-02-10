import { DownloadClientCard, SettingsSectionWide } from '@proton/components';
import { WALLET_CLIENTS } from '@proton/wallet';

export const WalletDownloadsSettingsPage = () => {
    return (
        <SettingsSectionWide>
            <div className="flex gap-4 flex-column md:flex-row">
                {Object.values(WALLET_CLIENTS).map(({ title, icon, link, items }) => {
                    return (
                        <div>
                            <DownloadClientCard title={title} icon={icon} link={link} items={items} />
                        </div>
                    );
                })}
            </div>
        </SettingsSectionWide>
    );
};
