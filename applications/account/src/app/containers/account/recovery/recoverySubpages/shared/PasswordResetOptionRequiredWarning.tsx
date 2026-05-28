import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import { selectAvailableRecoveryMethods } from '@proton/account/recovery/sessionRecoverySelectors';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import './PasswordResetOptionRequiredWarning.scss';

export const PasswordResetOptionRequiredWarningInGroup = ({ emailSubpagePath }: { emailSubpagePath: string }) => {
    const { hasAccountRecoveryMethod } = useSelector(selectAvailableRecoveryMethods);
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();

    if (hasAccountRecoveryMethod || loadingIsSentinelUser || isSentinelUser) {
        return null;
    }

    return (
        <div className="p-4 flex items-center justify-space-between gap-2 md:gap-4 lg:flex-nowrap password-reset-option-required-warning">
            <IcExclamationCircleFilled className="color-warning shrink-0" size={5} />
            <p className="m-0">{c('Info').t`Data recovery requires a password reset option (email or SMS)`}</p>
            <ButtonLike
                as={Link}
                to={emailSubpagePath}
                className="shrink-0 ml-auto bg-transparent text-semibold"
                shape="outline"
                size="small"
            >{c('emergency_access').t`Add option`}</ButtonLike>
        </div>
    );
};

const PasswordResetOptionRequiredWarning = ({ emailSubpagePath }: { emailSubpagePath: string }) => {
    const { hasAccountRecoveryMethod } = useSelector(selectAvailableRecoveryMethods);
    const [{ isSentinelUser }] = useIsSentinelUser();

    // Don't show banner for sentinel users even if they don't have an account recovery method
    if (hasAccountRecoveryMethod || (!hasAccountRecoveryMethod && isSentinelUser)) {
        return null;
    }

    return (
        <DashboardCardContent className="flex items-center justify-space-between gap-2 lg:flex-nowrap password-reset-option-required-warning">
            <p className="m-0">
                {c('Info').t`This data recovery method requires a password reset option (email or SMS)`}
            </p>
            {!isSentinelUser && (
                <ButtonLike
                    as={Link}
                    to={emailSubpagePath}
                    className="shrink-0 bg-transparent text-semibold"
                    shape="outline"
                    size="small"
                >{c('emergency_access').t`Add option`}</ButtonLike>
            )}
        </DashboardCardContent>
    );
};

export default PasswordResetOptionRequiredWarning;
