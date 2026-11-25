import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcArrowRotateRight } from '@proton/icons/icons/IcArrowRotateRight';
import { IcExclamationCircle } from '@proton/icons/icons/IcExclamationCircle';

import './RoleAssignmentStatusIcon.scss';

const RoleAssignmentStatusIcon = ({ isResuming }: { isResuming: boolean }) => {
    const title = isResuming ? c('tooltip').t`Resuming role assignment` : c('tooltip').t`Role assignment paused`;

    return (
        <Tooltip title={title} openDelay={0}>
            <span className="inline-flex shrink-0">
                {isResuming ? (
                    <IcArrowRotateRight className="role-assignment-resume-spin color-primary" alt={title} />
                ) : (
                    <IcExclamationCircle className="color-warning" alt={title} />
                )}
            </span>
        </Tooltip>
    );
};

export default RoleAssignmentStatusIcon;
