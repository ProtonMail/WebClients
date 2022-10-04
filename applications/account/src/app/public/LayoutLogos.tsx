import { CalendarLogo, DriveLogo, Href, IconSize, MailLogo, VpnLogo } from '@proton/components/components';
import {
    APPS,
    APP_NAMES,
    CALENDAR_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import { getStaticURL } from '@proton/shared/lib/helpers/url';

interface AppLogosProps {
    app: APP_NAMES;
    className: string;
    size: IconSize;
}

const LayoutLogos = ({ className, size, app }: AppLogosProps) => {
    return (
        <div className={className}>
            {[
                {
                    title: MAIL_APP_NAME,
                    url: app === APPS.PROTONVPN_SETTINGS ? 'https://proton.me/mail' : getStaticURL('/mail'),
                    logo: <MailLogo variant="glyph-only" size={size} />,
                },
                {
                    title: CALENDAR_APP_NAME,
                    url: app === APPS.PROTONVPN_SETTINGS ? 'https://proton.me/calendar' : getStaticURL('/calendar'),
                    logo: <CalendarLogo variant="glyph-only" size={size} />,
                },
                {
                    title: DRIVE_APP_NAME,
                    url: app === APPS.PROTONVPN_SETTINGS ? 'https://proton.me/drive' : getStaticURL('/drive'),
                    logo: <DriveLogo variant="glyph-only" size={size} />,
                },
                {
                    title: VPN_APP_NAME,
                    url: 'https://protonvpn.com',
                    logo: <VpnLogo variant="glyph-only" size={size} />,
                },
            ].map(({ title, url, logo }) => {
                return (
                    <Href
                        key={title}
                        href={url}
                        className="inline-block mx0-5 on-mobile-m0 on-tiny-mobile-w25"
                        title={title}
                    >
                        {logo}
                    </Href>
                );
            })}
        </div>
    );
};

export default LayoutLogos;
