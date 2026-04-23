import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { selectAvailableRecoveryMethods } from '@proton/account/recovery/sessionRecoverySelectors';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';

import './PasswordResetOptionRequiredWarning.scss';

const PasswordResetOptionRequiredWarning = ({ emailSubpagePath }: { emailSubpagePath: string }) => {
    const { hasAccountRecoveryMethod } = useSelector(selectAvailableRecoveryMethods);

    if (hasAccountRecoveryMethod) {
        return null;
    }

    return (
        <DashboardCardContent className="flex items-center gap-2 lg:flex-nowrap password-reset-option-required-warning">
            <p className="m-0">{c('Info')
                .t`To use this data recovery method, you must have a password reset option, like email verification or SMS verification.`}</p>
            <ButtonLike as={Link} to={emailSubpagePath} className="shrink-0" shape="outline" size="small">{c(
                'emergency_access'
            ).t`Add option`}</ButtonLike>
        </DashboardCardContent>
    );
};

export default PasswordResetOptionRequiredWarning;
