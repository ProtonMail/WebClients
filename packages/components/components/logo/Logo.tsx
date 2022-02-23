import { APP_NAMES, APPS } from '@proton/shared/lib/constants';

import CalendarLogo from './CalendarLogo';
import DriveLogo from './DriveLogo';
import MailLogo from './MailLogo';
import VpnLogo from './VpnLogo';
import { classnames } from '../../helpers';
import AppLink, { Props as AppLinkProps } from '../link/AppLink';

import './Logo.scss';

export type Version = 'with-wordmark' | 'standalone' | 'glyph-only';

const { PROTONCALENDAR, PROTONDRIVE, PROTONMAIL, PROTONVPN_SETTINGS } = APPS;
export interface LogoProps extends AppLinkProps {
    appName: APP_NAMES;
    version?: Version;
    current?: boolean;
}

const Logo = ({ appName, version, current = false, className, ...rest }: LogoProps) => {
    const classNames = classnames(['logo-link flex text-no-decoration', className]);

    const logo = (() => {
        if (appName === PROTONMAIL) {
            return <MailLogo version={version} />;
        }
        if (appName === PROTONCALENDAR) {
            return <CalendarLogo version={version} />;
        }
        if (appName === PROTONVPN_SETTINGS) {
            return <VpnLogo version={version} />;
        }
        if (appName === PROTONDRIVE) {
            return <DriveLogo version={version} />;
        }
        return null;
    })();

    return (
        <AppLink aria-current={current} className={classNames} {...rest}>
            {logo}
        </AppLink>
    );
};

export default Logo;
