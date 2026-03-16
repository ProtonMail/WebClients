import { c } from 'ttag';

import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import useIsSentinelUser from '@proton/components/hooks/useIsSentinelUser';
import { useIsSessionRecoveryEnabled } from '@proton/components/hooks/useSessionRecovery';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';

interface Props {
    to: string;
}

const SignedInResetBadge = () => {
    const isEnabled = useIsSessionRecoveryEnabled();
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loadingIsSentinelUser) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    if (isSentinelUser && isEnabled) {
        return (
            <StatusBadge
                status={StatusBadgeStatus.Warning}
                text={c('Status').t`Disable signed-in reset`}
                icon={IcShieldExclamationFilled}
            />
        );
    }
    if (isEnabled) {
        return <StatusBadge status={StatusBadgeStatus.On} text={c('Status').t`On`} />;
    }
    return <StatusBadge status={StatusBadgeStatus.Off} text={c('Status').t`Off`} />;
};

const SignedInReset = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcLock}
            title={c('Title').t`Signed-in reset`}
            tooltip={c('Tooltip').t`Allow resetting your password from the account settings`}
        >
            <SignedInResetBadge />
        </SettingsNavItem>
    );
};

export default SignedInReset;
