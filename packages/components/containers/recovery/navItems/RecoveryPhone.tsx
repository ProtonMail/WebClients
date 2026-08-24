import { c } from 'ttag';

import { selectAccountRecovery } from '@proton/account/recovery/accountRecovery';
import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import { IcMobile } from '@proton/icons/icons/IcMobile';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import SettingsNavItem from '../../layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '../../layout/StatusBadge';
import { LastChanged } from '../LastChanged';
import { NavItemStatus } from './NavItemStatus';

interface Props {
    to: string;
}

type PhoneState =
    { type: 'no-phone' } | { type: 'unverified'; phone: string } | { type: 'off' } | { type: 'active'; phone: string };

const getPhoneState = (phoneRecovery: ReturnType<typeof selectAccountRecovery>['phoneRecovery']): PhoneState => {
    if (!phoneRecovery.value) {
        return { type: 'no-phone' };
    }
    if (!phoneRecovery.hasReset) {
        return { type: 'off' };
    }
    if (!phoneRecovery.isVerified) {
        return { type: 'unverified', phone: phoneRecovery.value };
    }
    return { type: 'active', phone: phoneRecovery.value };
};

const RecoveryPhoneBadge = () => {
    const { phoneRecovery, loading } = useSelector(selectAccountRecovery);
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loading || loadingIsSentinelUser) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    const state = getPhoneState(phoneRecovery);

    if (isSentinelUser && (state.type === 'active' || state.type === 'unverified')) {
        return (
            <StatusBadge
                status={StatusBadgeStatus.Danger}
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
    const { phoneRecovery } = useSelector(selectAccountRecovery);

    return (
        <SettingsNavItem
            to={to}
            icon={IcMobile}
            title={c('Title').t`SMS verification`}
            tooltip={c('Tooltip').t`Allow recovering your account with a one-time code sent to your recovery phone`}
        >
            <NavItemStatus>
                <RecoveryPhoneBadge />
                <LastChanged
                    date={phoneRecovery.value ? phoneRecovery.updateTime : null}
                    data-testid="account:recovery-phone:last-changed-date"
                />
            </NavItemStatus>
        </SettingsNavItem>
    );
};

export default RecoveryPhone;
