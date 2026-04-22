import { c } from 'ttag';

import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import AppLink from '@proton/components/components/link/AppLink';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { type RecoveryScoreTone, SCORE_TONE_CLASS } from './recoveryScoreState';

interface Props extends Omit<ButtonLikeProps<typeof AppLink>, 'as' | 'to'> {
    scoreTone?: RecoveryScoreTone;
}

const SecureAccountButton = ({ scoreTone, className, ...restButtonProps }: Props) => {
    const securityCheckupParams = new URLSearchParams({
        back: encodeURIComponent(window.location.href),
        source: 'recovery_settings',
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
        >
            {c('Action').t`Secure account`}
        </ButtonLike>
    );
};

export default SecureAccountButton;
