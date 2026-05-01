import { c } from 'ttag';

import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import { selectSessionRecoveryData } from '@proton/account/recovery/sessionRecoverySelectors';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { IcSignedInReset } from '@proton/icons/icons/IcSignedInReset';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

interface Props {
    to: string;
}

const SignedInResetBadge = () => {
    const { isSessionRecoveryEnabled } = useSelector(selectSessionRecoveryData);
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loadingIsSentinelUser) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    if (isSentinelUser && isSessionRecoveryEnabled) {
        return (
            <StatusBadge
                status={StatusBadgeStatus.Warning}
                text={c('Status').t`Disable signed-in reset`}
                icon={IcShieldExclamationFilled}
            />
        );
    }
    if (isSessionRecoveryEnabled) {
        return <StatusBadge status={StatusBadgeStatus.On} text={c('Status').t`On`} />;
    }
    return <StatusBadge status={StatusBadgeStatus.Off} text={c('Status').t`Off`} />;
};

const SignedInReset = ({ to }: Props) => {
    return (
        <SettingsNavItem
            to={to}
            icon={IcSignedInReset}
            title={c('Title').t`Signed-in reset`}
            tooltip={c('Tooltip').t`Allow resetting your password from the account settings`}
        >
            <SignedInResetBadge />
        </SettingsNavItem>
    );
};

export default SignedInReset;
