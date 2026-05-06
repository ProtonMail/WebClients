import type { FC } from 'react';

import { c } from 'ttag';

import type { ApiImporterOrganizationUser } from '@proton/activation/src/api/api.interface';
import { type ProductStatus, ProductStatusState } from '@proton/activation/src/api/api.interface';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import useModalState, { type ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/index';
import type { IconName } from '@proton/icons/types';
import clsx from '@proton/utils/clsx';

import type { CreateMigrationBatchError } from '../../thunk';

export type UserWithExtendedErrors = ApiImporterOrganizationUser & { transferErrors: CreateMigrationBatchError[] };

export const terminalStatuses = [ProductStatusState.Completed, ProductStatusState.Error];

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

export const isTerminal = (u: ApiImporterOrganizationUser) =>
    terminalStatuses.includes(
        coalesceStatus(u.ImporterOrganizationUser?.ProductStatuses) ?? ProductStatusState.Initialized
    );

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
                text: c('BOSS').t`Pending`,
                className: 'color-hint',
            };
    }
};

const ImportErrorModal: FC<{
    user: UserWithExtendedErrors;
    modalProps: ModalStateProps;
}> = ({ user, modalProps }) => {
    const productErrors = user.ImporterOrganizationUser?.ProductStatuses.filter(
        (s) => s.State === ProductStatusState.Error
    );
    const { transferErrors } = user;
    const fallbackError = c('BOSS').t`No error details available. Please contact customer support for more information`;

    return (
        <ModalTwo {...modalProps}>
            <ModalTwoHeader title={c('BOSS').t`Import errors for ${user.AdminSetName}`} />
            <ModalTwoContent>
                {productErrors?.map((s) => (
                    <div key={s.Product} className="mb-4">
                        <p className="m-0 text-semibold">{s.Product}</p>
                        <p className="m-0 color-weak">{s.Error || fallbackError}</p>
                    </div>
                ))}
                {transferErrors.map(({ error }, i) => (
                    <div key={i} className="mb-4">
                        <p className="m-0 color-weak">{error.message || error.name || fallbackError}</p>
                    </div>
                ))}
                {!productErrors?.length && !transferErrors.length && <p className="m-0 color-weak">{fallbackError}</p>}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

const ImportStatus: FC<{
    user: UserWithExtendedErrors;
    className?: string;
}> = ({ user, className }) => {
    const [errorModalProps, setErrorModalOpen, renderErrorModal] = useModalState();

    const status =
        user.transferErrors.length > 0
            ? ProductStatusState.Error
            : coalesceStatus(user.ImporterOrganizationUser?.ProductStatuses);

    const config = getStatusConfig(status);
    const cls = clsx('inline-flex items-center gap-1 justify-end p-0', className, config.className);
    const label = (
        <>
            {config.icon && <Icon name={config.icon} className={config.iconClassName} />}
            {config.text}
        </>
    );

    return (
        <>
            {status === ProductStatusState.Error ? (
                <ButtonLike shape="ghost" onClick={() => setErrorModalOpen(true)} className={cls}>
                    {label}
                </ButtonLike>
            ) : (
                <div className={cls}>{label}</div>
            )}
            {renderErrorModal && <ImportErrorModal user={user} modalProps={errorModalProps} />}
        </>
    );
};

export default ImportStatus;
