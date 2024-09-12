import { c } from 'ttag';

import { CalendarLogo, DriveLogo, MailLogo, PassLogo, Tooltip, VpnLogo } from '@proton/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getDriveAppFeature } from '@proton/components/containers/payments/features/drive';
import { getMailAppFeature } from '@proton/components/containers/payments/features/mail';
import { getPassAppFeature } from '@proton/components/containers/payments/features/pass';
import { getVPNAppFeature } from '@proton/components/containers/payments/features/vpn';
import {
    APPS,
    BRAND_NAME,
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

const BundlePlanSubSection = ({
    className,
    vpnServersCountData,
}: {
    className?: string;
    vpnServersCountData: VPNServersCountData;
}) => {
    const logoSize = 8;
    return (
        <div className={clsx(className, 'card-plan-premium bg-weak p-4 rounded-xl w-full')}>
            <div className="color-weak text-center text-sm mb-4">
                {c('pass_signup_2023: Info').t`All premium ${BRAND_NAME} services.`}
                <br />
                {c('pass_signup_2023: Info').t`One easy subscription.`}
            </div>
            <div className="flex justify-center flex-nowrap gap-2">
                {[
                    {
                        app: APPS.PROTONMAIL,
                        title: MAIL_APP_NAME,
                        logo: <MailLogo variant="glyph-only" size={logoSize} />,
                        tooltip: getMailAppFeature().tooltip,
                    },
                    {
                        app: APPS.PROTONCALENDAR,
                        title: CALENDAR_APP_NAME,
                        logo: <CalendarLogo variant="glyph-only" size={logoSize} />,
                        tooltip: getCalendarAppFeature().tooltip,
                    },
                    {
                        app: APPS.PROTONDRIVE,
                        title: DRIVE_APP_NAME,
                        logo: <DriveLogo variant="glyph-only" size={logoSize} />,
                        tooltip: getDriveAppFeature().tooltip,
                    },
                    {
                        app: APPS.PROTONVPN_SETTINGS,
                        title: VPN_APP_NAME,
                        logo: <VpnLogo variant="glyph-only" size={logoSize} />,
                        tooltip: getVPNAppFeature({ serversCount: vpnServersCountData }).tooltip,
                    },
                    {
                        app: APPS.PROTONPASS,
                        title: PASS_APP_NAME,
                        logo: <PassLogo variant="glyph-only" size={logoSize} />,
                        tooltip: getPassAppFeature().tooltip,
                    },
                ].map(({ title, logo, tooltip }) => {
                    return (
                        <Tooltip key={title} title={tooltip} openDelay={0} closeDelay={0}>
                            <div title={title}>{logo}</div>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};

export default BundlePlanSubSection;
