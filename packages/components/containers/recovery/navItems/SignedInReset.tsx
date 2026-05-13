import { c } from 'ttag';

import { selectSessionRecoveryData } from '@proton/account/recovery/sessionRecoverySelectors';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { StatusBadge, StatusBadgeStatus } from '@proton/components/containers/layout/StatusBadge';
import { IcSignedInReset } from '@proton/icons/icons/IcSignedInReset';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

interface Props {
    to: string;
}

const SignedInResetBadge = () => {
    const { isSessionRecoveryEnabled, isSessionRecoveryAvailable, loading } = useSelector(selectSessionRecoveryData);

    if (loading) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    if (isSessionRecoveryEnabled && isSessionRecoveryAvailable) {
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
