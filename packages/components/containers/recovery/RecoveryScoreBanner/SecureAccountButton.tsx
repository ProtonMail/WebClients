import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import AppLink from '@proton/components/components/link/AppLink';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { useRecoverySettingsTelemetry } from '../recoverySettingsTelemetry';
import { type RecoveryScoreTone, SCORE_TONE_CLASS } from './recoveryScoreState';

interface Props extends Omit<ButtonLikeProps<typeof AppLink>, 'as' | 'to'> {
    scoreTone?: RecoveryScoreTone;
    label?: ReactNode;
}

const SecureAccountButton = ({ scoreTone, label, className, ...restButtonProps }: Props) => {
    const app = getAppFromPathnameSafe(window.location.pathname);
    const { sendAccountSafetyReviewClick } = useRecoverySettingsTelemetry();
    const securityCheckupParams = new URLSearchParams({
        back: encodeURIComponent(window.location.href),
        source: 'recovery_settings',
        ...(app && { appname: app }),
        v: 'new',
    });

    return (
        <ButtonLike
            {...restButtonProps}
            as={AppLink}
            to={`${SECURITY_CHECKUP_PATHS.ROOT}?${securityCheckupParams.toString()}`}
            color="norm"
            shape="solid"
            className={clsx(
                'recovery-score-accent recovery-score-banner-button text-semibold',
                scoreTone && `recovery-score-accent-${SCORE_TONE_CLASS[scoreTone]}`,
                className
            )}
            onClick={() => sendAccountSafetyReviewClick()}
        >
            {label ?? c('Action').t`Secure account`}
        </ButtonLike>
    );
};

export default SecureAccountButton;
