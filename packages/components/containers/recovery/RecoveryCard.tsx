import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Icon from '@proton/components/components/icon/Icon';
import AppLink from '@proton/components/components/link/AppLink';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useIsSecurityCheckupAvailable from '@proton/components/hooks/securityCheckup/useIsSecurityCheckupAvailable';
import useSecurityCheckup from '@proton/components/hooks/securityCheckup/useSecurityCheckup';
import type { IconName } from '@proton/icons/types';
import { SECURITY_CHECKUP_PATHS } from '@proton/shared/lib/constants';
import { SecurityCheckupCohort } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';
import clsx from '@proton/utils/clsx';

const GenericSecurityCheckupCard = ({
    title,
    subtitle,
    icon,
    color,
    description,
    cta,
}: {
    title: string;
    subtitle: string;
    icon: IconName;
    color: 'success' | 'danger' | 'info' | 'warning';
    description?: string | ReturnType<typeof getBoldFormattedText>;
    cta: string;
}) => {
    const securityCheckupParams = new URLSearchParams({
        back: encodeURIComponent(window.location.href),
        source: 'recovery_settings',
    });

    return (
        <div className="rounded border max-w-custom p-8 flex flex-column gap-8" style={{ '--max-w-custom': '46em' }}>
            <div className="flex flex-nowrap items-center gap-4">
                <div className={clsx('rounded p-2 overflow-hidden', `security-checkup-color--${color}`)}>
                    <Icon name={icon} size={10} />
                </div>
                <div>
                    <h2 className="h3 text-bold mb-0">{title}</h2>
                    <div className="color-weak max-w-custom">{subtitle}</div>
                </div>
            </div>

            <div>{description}</div>

            <ButtonLike
                className="self-start"
                as={AppLink}
                to={`${SECURITY_CHECKUP_PATHS.ROOT}?${securityCheckupParams.toString()}`}
                color="norm"
            >
                {cta}
            </ButtonLike>
        </div>
    );
};

const SecurityCheckupCard = () => {
    const securityCheckup = useSecurityCheckup();

    const { actions, furtherActions, cohort } = securityCheckup;

    if (cohort === SecurityCheckupCohort.Common.COMPLETE_RECOVERY) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Your account and data can be recovered`}
                subtitle={c('Safety review').t`Your account is fully secure.`}
                icon="pass-shield-ok"
                color="success"
                description={c('Safety review')
                    .t`Your account and data can be recovered. Check if you can still access your recovery methods.`}
                cta={c('Safety review').t`Check account security`}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.Default.COMPLETE_RECOVERY_SINGLE) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Safeguard your account`}
                subtitle={c('Safety review').t`You have recommended actions.`}
                icon="pass-shield-warning"
                color="info"
                description={c('Safety review')
                    .t`Your account and data can be recovered. You have recommended actions to safeguard your account further.`}
                cta={c('Safety review').t`Safeguard account now`}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Safeguard your account`}
                subtitle={c('Safety review').t`You are at risk of losing access to your data.`}
                icon="pass-shield-warning"
                color="warning"
                description={getBoldFormattedText(
                    c('Safety review')
                        .t`If you lose your login details and need to reset your account, **it’s imperative** that you have both an **account recovery and data recovery method** in place, otherwise you might not be able to access any of your emails, contacts, files or passwords.`
                )}
                cta={c('Safety review').t`Safeguard account now`}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.Sentinel.COMPLETE_RECOVERY_SENTINEL) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Safeguard your account`}
                subtitle={c('Safety review').t`Your account and data can be recovered.`}
                icon="pass-shield-warning"
                color="info"
                description={c('Safety review').t`You have recommended actions to safeguard your account further.`}
                cta={c('Safety review').t`Safeguard account now`}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Safeguard your account`}
                subtitle={c('Safety review').t`You have recommended actions.`}
                icon="pass-shield-warning"
                color="warning"
                description={getBoldFormattedText(
                    c('Safety review').t`You have recommended actions to safeguard your account further.`
                )}
                cta={c('Safety review').t`Safeguard account now`}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.Common.NO_RECOVERY_METHOD) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Safeguard your account`}
                subtitle={c('Safety review').t`You are at risk of losing access to your account and data.`}
                icon="pass-shield-warning"
                color="danger"
                description={getBoldFormattedText(
                    c('Safety review')
                        .t`If you lose your login details and need to reset your account, **it’s imperative** that you have both an **account recovery and data recovery method** in place, otherwise you might not be able to access any of your emails, contacts, files or passwords.`
                )}
                cta={c('Safety review').t`Safeguard account now`}
            />
        );
    }

    if (actions.length || furtherActions.length) {
        return (
            <GenericSecurityCheckupCard
                title={c('Safety review').t`Safeguard your account`}
                subtitle={c('Safety review').t`You have recommended actions.`}
                icon="pass-shield-warning"
                color="info"
                cta={c('Safety review').t`Safeguard account now`}
            />
        );
    }

    return (
        <GenericSecurityCheckupCard
            title={c('Safety review').t`Safeguard your account`}
            subtitle={c('Safety review').t`Your account is fully secure.`}
            icon="pass-shield-ok"
            color="success"
            cta={c('Safety review').t`Check account security`}
        />
    );
};

const RecoveryCard = () => {
    const isSecurityCheckupAvailable = useIsSecurityCheckupAvailable();
    if (!isSecurityCheckupAvailable) {
        return null;
    }
    return <SecurityCheckupCard />;
};

export default RecoveryCard;
