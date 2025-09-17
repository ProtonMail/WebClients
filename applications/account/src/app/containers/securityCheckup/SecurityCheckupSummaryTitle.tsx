import { c } from 'ttag';

import type { IconName } from '@proton/components';
import { Icon, useSecurityCheckup } from '@proton/components';
import { SecurityCheckupCohort } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';
import clsx from '@proton/utils/clsx';

const Title = ({
    subline,
    color,
    icon,
    className,
}: {
    subline: string;
    color: 'success' | 'danger' | 'info' | 'warning';
    icon: IconName;
    className?: string;
}) => {
    return (
        <div className={clsx('flex flex-column items-center gap-1 text-center', className)}>
            <div className={clsx('rounded-full p-6 overflow-hidden', `security-checkup-color--${color}`)}>
                <Icon name={icon} size={10} />
            </div>
            <h1 className="text-4xl text-bold">{c('Safety review').t`Account safety review`}</h1>
            <div className="color-weak max-w-custom" style={{ '--max-w-custom': '20rem' }}>
                {subline}
            </div>
        </div>
    );
};

const SecurityCheckupSummaryTitle = ({ className }: { className?: string }) => {
    const { cohort } = useSecurityCheckup();

    if (cohort === SecurityCheckupCohort.Common.COMPLETE_RECOVERY) {
        return (
            <Title
                subline={c('Safety review').t`Your account is secure.`}
                icon="pass-shield-ok"
                color="success"
                className={className}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.Default.COMPLETE_RECOVERY_SINGLE) {
        return (
            <Title
                subline={c('Safety review').t`Your account and data can be recovered. You have recommended actions.`}
                icon="pass-shield-warning"
                color="info"
                className={className}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.Default.ACCOUNT_RECOVERY_ENABLED) {
        return (
            <Title
                subline={c('Safety review').t`You are at risk of losing access to your data.`}
                icon="pass-shield-warning"
                color="warning"
                className={className}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.Sentinel.COMPLETE_RECOVERY_SENTINEL) {
        return (
            <Title
                subline={c('Safety review').t`Your account and data can be recovered. You have recommended actions.`}
                icon="pass-shield-ok"
                color="info"
                className={className}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.Sentinel.SENTINEL_RECOMMENDATIONS) {
        return (
            <Title
                subline={c('Safety review').t`You have recommended actions to safeguard your account.`}
                icon="pass-shield-warning"
                color="warning"
                className={className}
            />
        );
    }

    if (cohort === SecurityCheckupCohort.Common.NO_RECOVERY_METHOD) {
        return (
            <Title
                subline={c('Safety review').t`You are at risk of losing access to your account and data.`}
                icon="pass-shield-warning"
                color="danger"
                className={className}
            />
        );
    }
};

export default SecurityCheckupSummaryTitle;
