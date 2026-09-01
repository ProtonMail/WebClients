import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';
import clsx from '@proton/utils/clsx';

import type { ApiImporterOrganizationUser } from '../../../api/api.interface';
import { ProductStatusState } from '../../../api/api.interface';
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

const getStatusConfig = (status?: ProductStatusState): { text: string; icon?: ReactNode; className?: string } => {
    switch (status) {
        case ProductStatusState.Initialized:
        case ProductStatusState.Active:
            return {
                text: c('Import status').t`In progress`,
                icon: <IcClock />,
                className: 'color-success',
            };
        case ProductStatusState.Completed:
            return {
                text: c('Import status').t`Migrated`,
                icon: <IcCheckmarkCircleFilled className="color-success" />,
                className: 'color-weak',
            };
        case ProductStatusState.Error:
            return {
                text: c('Import status').t`Has errors`,
                icon: <IcExclamationTriangleFilled />,
                className: 'color-danger',
            };
        default:
            return {
                text: c('Import status').t`Pending`,
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
            {config.icon}
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
