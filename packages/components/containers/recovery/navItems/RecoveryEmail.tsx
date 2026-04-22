import { c } from 'ttag';

import { selectAccountRecovery } from '@proton/account/recovery/accountRecovery';
import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import SettingsNavItem from '@proton/components/containers/layout/SettingsNavItem';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import { StatusBadge, StatusBadgeStatus } from '../../layout/StatusBadge';

interface Props {
    to: string;
}

type EmailState =
    | { type: 'no-email' }
    | { type: 'unverified'; email: string }
    | { type: 'off' }
    | { type: 'active'; email: string };

const getEmailState = (emailRecovery: ReturnType<typeof selectAccountRecovery>['emailRecovery']): EmailState => {
    if (!emailRecovery.value) {
        return { type: 'no-email' };
    }
    if (!emailRecovery.hasReset) {
        return { type: 'off' };
    }
    if (!emailRecovery.isVerified) {
        return { type: 'unverified', email: emailRecovery.value };
    }
    return { type: 'active', email: emailRecovery.value };
};

const RecoveryEmailBadge = () => {
    const { emailRecovery, loading } = useSelector(selectAccountRecovery);
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (loading || loadingIsSentinelUser) {
        return <StatusBadge status={StatusBadgeStatus.Off} loading={true} />;
    }

    const state = getEmailState(emailRecovery);
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
