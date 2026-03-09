import type { FC } from 'react';

import { c } from 'ttag';

import {
    type ApiImporterOrganizationUser,
    type ProductStatus,
    ProductStatusState,
} from '@proton/activation/src/api/api.interface';
import { Icon } from '@proton/components/index';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

export const coalesceStatus = (statuses?: ProductStatus[]) => {
    if (!statuses) {
        return;
    }

    const anyImportActive = statuses.find(
        (s) => s.State === ProductStatusState.Active || s.State === ProductStatusState.Initialized
    );
    if (anyImportActive) {
        return ProductStatusState.Active;
    }

    // Check for all completed
    const allCompleted = statuses.every((s) => s.State === ProductStatusState.Completed);
    if (allCompleted) {
        return ProductStatusState.Completed;
    }

    // Check for any errors
    const anyErrors = statuses.find((s) => s.State === ProductStatusState.Error);
    if (anyErrors) {
        return ProductStatusState.Error;
    }

    // Default case
    return ProductStatusState.Initialized;
};

const getStatusConfig = (
    status?: ProductStatusState
): { text: string; icon?: IconName; iconClassName?: string; className?: string } => {
    switch (status) {
        case ProductStatusState.Initialized:
        case ProductStatusState.Active:
            return {
                text: c('BOSS').t`In progress`,
                icon: 'clock',
                className: 'color-success',
            };
        case ProductStatusState.Completed:
            return {
                text: c('BOSS').t`Completed`,
                icon: 'checkmark-circle-filled',
                iconClassName: 'color-success',
            };
        case ProductStatusState.Error:
            return {
                text: c('BOSS').t`Has errors`,
                icon: 'exclamation-triangle-filled',
                className: 'color-danger',
            };
        default:
            return {
                text: c('BOSS').t`Not started`,
                className: 'color-weak',
            };
    }
};

const ImportStatus: FC<{ user: ApiImporterOrganizationUser; className?: string }> = ({ user, className }) => {
    const coalescedStatus = coalesceStatus(user.ImporterOrganizationUser?.ProductStatuses);
    const config = getStatusConfig(coalescedStatus);

    return (
        <div className={clsx('flex items-center gap-1 justify-end', className, config.className)}>
            {config.icon && <Icon name={config.icon} className={config.iconClassName} />}
            {config.text}
        </div>
    );
};

export default ImportStatus;
