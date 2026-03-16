import { c } from 'ttag';

import { useUserSettings } from '@proton/account/index';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import useIsSentinelUser from '@proton/components/hooks/useIsSentinelUser';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces/UserSettings';

import { StatusBadge, StatusBadgeStatus } from '../../layout/StatusBadge';

interface Props {
    to: string;
}

type EmailState =
    | { type: 'no-email' }
    | { type: 'unverified'; email: string }
    | { type: 'off' }
    | { type: 'active'; email: string };

const getEmailState = (email: { Value: string; Status: SETTINGS_STATUS; Reset: number }): EmailState => {
    if (!email.Value) {
        return { type: 'no-email' };
    }
    if (email.Reset === 0) {
        return { type: 'off' };
    }
    if (email.Status !== SETTINGS_STATUS.VERIFIED) {
        return { type: 'unverified', email: email.Value };
    }
    return { type: 'active', email: email.Value };
};

const RecoveryEmailBadge = () => {
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loadingUserSettings || loadingIsSentinelUser || !userSettings) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    const state = getEmailState(userSettings.Email);
    if (isSentinelUser && (state.type === 'active' || state.type === 'unverified')) {
        return (
            <StatusBadge
                status={StatusBadgeStatus.Warning}
                text={c('Status').t`Disable recovery by email`}
                icon={IcShieldExclamationFilled}
            />
        );
    }
    if (state.type === 'off') {
        return <StatusBadge status={StatusBadgeStatus.Off} text={c('Status').t`Off`} />;
    }
    if (state.type === 'no-email') {
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Add an email address`} />;
    }
    if (state.type === 'unverified') {
        const value = state.email;
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Verify ${value}`} />;
    }
    return <span className="color-weak">{state.email}</span>;
};

const RecoveryEmail = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcEnvelope}
            title={c('Title').t`Email verification`}
            tooltip={c('Tooltip').t`Allow recovering your account with a one-time code sent to your recovery email`}
        >
            <RecoveryEmailBadge />
        </SettingsNavItem>
    );
};

export default RecoveryEmail;
