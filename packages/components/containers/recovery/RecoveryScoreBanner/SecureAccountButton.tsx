import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useConfig } from '@proton/app-context/useConfig';
import type { ButtonLikeProps } from '@proton/atoms/Button/ButtonLike';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import AppLink from '../../../components/link/AppLink';
import { useRecoverySettingsTelemetry } from '../recoverySettingsTelemetry';
import { type RecoveryScoreTone, SCORE_TONE_CLASS } from './recoveryScoreState';

interface Props extends Omit<ButtonLikeProps<typeof AppLink>, 'as' | 'to'> {
    scoreTone?: RecoveryScoreTone;
    label?: ReactNode;
}

const SecureAccountButton = ({ scoreTone, label, className, ...restButtonProps }: Props) => {
    const { APP_NAME } = useConfig();
    // Account hosts every product behind a slug (/u/0/vpn/recovery), so the product comes from the path there.
    // Standalone settings apps and generic account settings have no slug, so the app itself is the product.
    const app = getAppFromPathnameSafe(window.location.pathname) ?? APP_NAME;
    const { sendAccountSafetyReviewClick } = useRecoverySettingsTelemetry();
    const securityCheckupParams = new URLSearchParams({
        back: encodeURIComponent(window.location.href),
        source: 'recovery_settings',
        appname: app,
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
