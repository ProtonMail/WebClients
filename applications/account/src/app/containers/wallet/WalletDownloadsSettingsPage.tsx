import { c } from 'ttag';

import { DownloadClientCard, SettingsParagraph, SettingsSectionWide, Tooltip } from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { WALLET_CLIENTS } from '@proton/wallet';

export const WalletDownloadsSettingsPage = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('wallet_signup_2024:Info')
                    .t`${WALLET_APP_NAME} is in Early Access. You can download the iOS app through Apple TestFlight and the Android app through Google open testing.`}
            </SettingsParagraph>
            <div className="flex gap-4 flex-column md:flex-row">
                {Object.values(WALLET_CLIENTS).map(({ title, icon, link }) => {
                    return (
                        <Tooltip key={title} title={!link && c('wallet_signup_2024:Info').t`Coming soon`}>
                            <div>
                                <DownloadClientCard title={title} icon={icon} link={link} />
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
        </SettingsSectionWide>
    );
};
