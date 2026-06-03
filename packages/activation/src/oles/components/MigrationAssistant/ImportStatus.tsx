import type { FC } from 'react';

import { c } from 'ttag';

import type { ApiImporterOrganizationUser } from '@proton/activation/src/api/api.interface';
import { ProductStatusState } from '@proton/activation/src/api/api.interface';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import type { CreateMigrationBatchError } from '../../thunk';
import { transferErrorUserFilter } from './ImportJournalModal';

export const terminalStatuses = [ProductStatusState.Completed, ProductStatusState.Error];

export const coalesceStatus = (user: ApiImporterOrganizationUser, transferErrors?: CreateMigrationBatchError[]) => {
    if (transferErrors?.filter(transferErrorUserFilter(user)).length) {
        return ProductStatusState.Error;
    }

    const statuses = user.ImporterOrganizationUser?.ProductStatuses;

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

export const isTerminal = (u: ApiImporterOrganizationUser) =>
    terminalStatuses.includes(coalesceStatus(u) ?? ProductStatusState.Initialized);

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
                text: c('BOSS').t`Migrated`,
                icon: 'checkmark-circle-filled',
                iconClassName: 'color-success',
                className: 'color-weak',
            };
        case ProductStatusState.Error:
            return {
                text: c('BOSS').t`Has errors`,
                icon: 'exclamation-triangle-filled',
                className: 'color-danger',
            };
        default:
            return {
                text: c('BOSS').t`Pending`,
                className: 'color-hint',
            };
    }
};

const ImportStatus: FC<{
    status: ProductStatusState | undefined;
    onClick?: () => void;
    className?: string;
}> = ({ status, onClick, className }) => {
    const config = getStatusConfig(status);
    const cls = clsx('inline-flex items-center gap-2 p-0', className, config.className);
    const label = (
        <>
            {config.icon && <Icon name={config.icon} className={config.iconClassName} />}
            {config.text}
        </>
    );

    return (
        <>
            {onClick ? (
                <ButtonLike shape="ghost" onClick={onClick} className={cls}>
                    {label}
                </ButtonLike>
            ) : (
                <div className={cls}>{label}</div>
            )}
        </>
    );
};

export default ImportStatus;
