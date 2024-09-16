import { APPS } from '@proton/shared/lib/constants';
import type { SecurityCheckupSource } from '@proton/shared/lib/interfaces/securityCheckup';

const getSource = ({
    pathname,
    search,
}: {
    pathname: string;
    search: URLSearchParams;
}): SecurityCheckupSource | undefined => {
    if (pathname.includes('safety-review/source/email-danger')) {
        return 'email_danger';
    }
    if (pathname.includes('safety-review/source/email-warning')) {
        return 'email_warning';
    }
    if (pathname.includes('safety-review/source/email-info')) {
        return 'email_info';
    }

    const sourceParam = search.get('source');
    const appnameParam = search.get('appname');

    if (sourceParam === 'user_dropdown' && appnameParam === APPS.PROTONACCOUNT) {
        return 'user_dropdown_account';
    }
    if (sourceParam === 'user_dropdown' && appnameParam === APPS.PROTONVPN_SETTINGS) {
        return 'user_dropdown_vpn_settings';
    }
    if (sourceParam === 'user_dropdown' && appnameParam === APPS.PROTONMAIL) {
        return 'user_dropdown_mail';
    }
    if (sourceParam === 'user_dropdown' && appnameParam === APPS.PROTONCALENDAR) {
        return 'user_dropdown_calendar';
    }
    if (sourceParam === 'user_dropdown' && appnameParam === APPS.PROTONDRIVE) {
        return 'user_dropdown_drive';
    }
    if (sourceParam === 'user_dropdown' && appnameParam === APPS.PROTONDOCS) {
        return 'user_dropdown_docs';
    }

    if (sourceParam === 'recovery_settings') {
        return 'recovery_settings';
    }

    return undefined;
};

export default getSource;
