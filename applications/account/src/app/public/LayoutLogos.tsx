import { CalendarLogo, DriveLogo, IconSize, MailLogo, VpnLogo } from '@proton/components/components';
import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

interface AppLogosProps {
    size: IconSize;
    className?: string;
}

const LayoutLogos = ({ size, className }: AppLogosProps) => {
    return (
        <div className={clsx(className, 'flex flex-justify-center gap-4 sm:gap-8')}>
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
                    <div key={title} className="inline-block on-tiny-mobile-max-w50p" title={title}>
                        {logo}
                    </div>
                );
            })}
        </div>
    );
};

export default LayoutLogos;
