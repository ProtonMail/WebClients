import React from 'react';

import { c } from 'ttag';

import { DownloadClientCard } from '@proton/components/components';
import { SettingsParagraph, SettingsSectionWide } from '@proton/components/containers';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { WALLET_CLIENTS } from '@proton/wallet';

export const WalletDownloadsSettingsPage = () => {
    return (
        <SettingsSectionWide>
            <SettingsParagraph>
                {c('wallet_signup_2024:Info')
                    .t`Seamlessly hold and transfer bitcoins. Install the relevant ${WALLET_APP_NAME} apps.`}
            </SettingsParagraph>
            <div className="flex gap-4 flex-column md:flex-row">
                {Object.values(WALLET_CLIENTS).map(({ title, icon, link }) => {
                    if (!link) {
                        return null;
                    }

                    return <DownloadClientCard key={title} title={title} icon={icon} link={link} />;
                })}
            </div>
        </SettingsSectionWide>
    );
};
