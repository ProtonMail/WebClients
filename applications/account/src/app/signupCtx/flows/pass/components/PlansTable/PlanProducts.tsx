import type { FC } from 'react';

import { CalendarLogo, DriveLogo, MailLogo, PassLogo, VpnLogo, WalletLogo } from '@proton/components';
import {
    CALENDAR_SHORT_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
    WALLET_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';

export const PlanProducts: FC = () => {
    const products = [
        {
            title: MAIL_SHORT_APP_NAME,
            logo: <MailLogo variant="glyph-only" size={8} />,
        },
        {
            title: CALENDAR_SHORT_APP_NAME,
            logo: <CalendarLogo variant="glyph-only" size={8} />,
        },
        {
            title: VPN_SHORT_APP_NAME,
            logo: <VpnLogo variant="glyph-only" size={8} />,
        },
        {
            title: DRIVE_SHORT_APP_NAME,
            logo: <DriveLogo variant="glyph-only" size={8} />,
        },
        {
            title: PASS_SHORT_APP_NAME,
            logo: <PassLogo variant="glyph-only" size={8} />,
        },
        {
            title: WALLET_SHORT_APP_NAME,
            logo: <WalletLogo variant="glyph-only" size={8} />,
        },
    ];

    return (
        <div className="w-full flex justify-space-between mt-6">
            {products.map(({ title, logo }) => (
                <div key={title} className="flex flex-column items-center">
                    {logo}
                    <div className="text-xs">{title}</div>
                </div>
            ))}
        </div>
    );
};
