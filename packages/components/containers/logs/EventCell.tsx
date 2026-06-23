import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { IcCrossCircleFilled } from '@proton/icons/icons/IcCrossCircleFilled';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcPassShieldFillDanger } from '@proton/icons/icons/IcPassShieldFillDanger';
import { IcShield2CheckFilled } from '@proton/icons/icons/IcShield2CheckFilled';
import type { AuthLog } from '@proton/shared/lib/authlog';
import { AuthLogStatus } from '@proton/shared/lib/authlog';
import clsx from '@proton/utils/clsx';

interface Props {
    description: AuthLog['Description'];
    status: AuthLog['Status'];
    isB2B?: boolean;
}

const getIcon = (status: AuthLogStatus, isB2B: boolean) => {
    switch (status) {
        case AuthLogStatus.Attempt:
            return <IcExclamationCircleFilled className="align-text-bottom color-warning" />;
        case AuthLogStatus.Failure:
            return isB2B ? (
                <IcPassShieldFillDanger className="align-text-bottom color-danger" />
            ) : (
                <IcCrossCircleFilled className="align-text-bottom color-danger" />
            );
    }
    return isB2B ? (
        <IcShield2CheckFilled className="align-text-bottom color-success" />
    ) : (
        <IcCheckmarkCircleFilled className="align-text-bottom color-success" />
    );
};

const EventCell = ({ description, status, isB2B = false }: Props) => {
    return (
        <div className="inline-flex">
            <span className="shrink-0 mr-2">{getIcon(status, isB2B)}</span>
            <span className={clsx('flex-1', isB2B && 'color-norm')}>{description}</span>
        </div>
    );
};

export default EventCell;
