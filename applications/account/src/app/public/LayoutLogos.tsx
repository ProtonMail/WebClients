import { CalendarLogo, DriveLogo, IconSize, MailLogo, VpnLogo } from '@proton/components/components';
import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';

interface AppLogosProps {
    className: string;
    size: IconSize;
}

const LayoutLogos = ({ className, size }: AppLogosProps) => {
    return (
        <div className={className}>
            {[
                {
                    title: MAIL_APP_NAME,
                    logo: <MailLogo variant="glyph-only" size={size} />,
                },
                {
                    title: CALENDAR_APP_NAME,
                    logo: <CalendarLogo variant="glyph-only" size={size} />,
                },
                {
                    title: DRIVE_APP_NAME,
                    logo: <DriveLogo variant="glyph-only" size={size} />,
                },
                {
                    title: VPN_APP_NAME,
                    logo: <VpnLogo variant="glyph-only" size={size} />,
                },
            ].map(({ title, logo }) => {
                return (
                    <div key={title} className="inline-block mx0-5 on-mobile-m0 on-tiny-mobile-w25" title={title}>
                        {logo}
                    </div>
                );
            })}
        </div>
    );
};

export default LayoutLogos;
