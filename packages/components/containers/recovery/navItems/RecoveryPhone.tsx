import { c } from 'ttag';

import { useUserSettings } from '@proton/account/index';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import useIsSentinelUser from '@proton/components/hooks/useIsSentinelUser';
import { IcMobile } from '@proton/icons/icons/IcMobile';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { SETTINGS_STATUS } from '@proton/shared/lib/interfaces/UserSettings';

import { StatusBadge, StatusBadgeStatus } from '../../layout/StatusBadge';

interface Props {
    to: string;
}

type PhoneState =
    | { type: 'no-phone' }
    | { type: 'unverified'; phone: string }
    | { type: 'off' }
    | { type: 'active'; phone: string };

const getPhoneState = (phone: { Value: string; Status: SETTINGS_STATUS; Reset: number }): PhoneState => {
    if (!phone.Value) {
        return { type: 'no-phone' };
    }
    if (phone.Reset === 0) {
        return { type: 'off' };
    }
    if (phone.Status !== SETTINGS_STATUS.VERIFIED) {
        return { type: 'unverified', phone: phone.Value };
    }
    return { type: 'active', phone: phone.Value };
};

const RecoveryPhoneBadge = () => {
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loadingUserSettings || loadingIsSentinelUser || !userSettings) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    const state = getPhoneState(userSettings.Phone);

    if (isSentinelUser && (state.type === 'active' || state.type === 'unverified')) {
        return (
            <StatusBadge
                status={StatusBadgeStatus.Warning}
                text={c('Status').t`Disable recovery by phone`}
                icon={IcShieldExclamationFilled}
            />
        );
    }
    if (state.type === 'off') {
        return <StatusBadge status={StatusBadgeStatus.Off} text={c('Status').t`Off`} />;
    }
    if (state.type === 'no-phone') {
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Add a phone number`} />;
    }
    if (state.type === 'unverified') {
        const value = state.phone;
        return <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Verify ${value}`} />;
    }
    return <span className="color-weak">{state.phone}</span>;
};

const RecoveryPhone = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcMobile}
            title={c('Title').t`SMS verification`}
            tooltip={c('Tooltip').t`Allow recovering your account with a one-time code sent to your recovery phone`}
        >
            <RecoveryPhoneBadge />
        </SettingsNavItem>
    );
};

export default RecoveryPhone;
