import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { CalendarLogo, DriveLogo, MailLogo, PassLogo, Tooltip, VpnLogo } from '@proton/components';
import { getCalendarAppFeature } from '@proton/components/containers/payments/features/calendar';
import { getDriveAppFeature } from '@proton/components/containers/payments/features/drive';
import { getMailAppFeature } from '@proton/components/containers/payments/features/mail';
import { getPassAppFeature } from '@proton/components/containers/payments/features/pass';
import { getVPNAppFeature } from '@proton/components/containers/payments/features/vpn';
import {
    APPS,
    CALENDAR_APP_NAME,
    CALENDAR_SHORT_APP_NAME,
    DRIVE_APP_NAME,
    DRIVE_SHORT_APP_NAME,
    MAIL_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';

const LetsTalkSubSection = ({ vpnServersCountData }: { vpnServersCountData: VPNServersCountData }) => {
    const logoSize = 8;
    return (
        <div className="flex flex-column gap-4 w-full">
            <div className="text-left text-sm">
                {c('pass_signup_2023: Info').t`Tailored made solutions for larger organizations with custom needs.`}
            </div>
            <ButtonLike
                as="a"
                shape="outline"
                color="norm"
                fullWidth
                pill
                href={getStaticURL('/business/contact?pd=pass&int=enterprise&ref=appdashboard')}
                target="_blank"
            >
                {c('pass_signup_2023: Action').t`Request trial`}
            </ButtonLike>
            <div className="flex justify-center flex-nowrap gap-2 text-center">
                {[
                    {
                        app: APPS.PROTONMAIL,
                        title: MAIL_APP_NAME,
                        shortTitle: MAIL_SHORT_APP_NAME,
                        logo: <MailLogo variant="glyph-only" size={logoSize} />,
                        tooltip: getMailAppFeature().tooltip,
                    },
                    {
                        app: APPS.PROTONCALENDAR,
                        title: CALENDAR_APP_NAME,
                        shortTitle: CALENDAR_SHORT_APP_NAME,
                        logo: <CalendarLogo variant="glyph-only" size={logoSize} />,
                        tooltip: getCalendarAppFeature().tooltip,
                    },
                    {
                        app: APPS.PROTONDRIVE,
                        title: DRIVE_APP_NAME,
                        shortTitle: DRIVE_SHORT_APP_NAME,
                        logo: <DriveLogo variant="glyph-only" size={logoSize} />,
                        tooltip: getDriveAppFeature().tooltip,
                    },
                    {
                        app: APPS.PROTONVPN_SETTINGS,
                        title: VPN_APP_NAME,
                        shortTitle: VPN_SHORT_APP_NAME,
                        logo: <VpnLogo variant="glyph-only" size={logoSize} />,
                        tooltip: getVPNAppFeature({ serversCount: vpnServersCountData }).tooltip,
                    },
                    {
                        app: APPS.PROTONPASS,
                        title: PASS_APP_NAME,
                        shortTitle: PASS_SHORT_APP_NAME,
                        logo: <PassLogo variant="glyph-only" size={logoSize} />,
                        tooltip: getPassAppFeature().tooltip,
                    },
                ].map(({ title, shortTitle, logo, tooltip }) => {
                    return (
                        <Tooltip key={title} title={tooltip} openDelay={0} closeDelay={0}>
                            <div title={title}>
                                <div>{logo}</div>
                                <div className="color-weak text-xs">{shortTitle}</div>
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};

export default LetsTalkSubSection;
