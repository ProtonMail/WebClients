import type { FC } from 'react';

import { c } from 'ttag';

import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import clsx from '@proton/utils/clsx';

const NotActivated = () => <span className="color-hint">{c('BOSS').t`Not activated`}</span>;

const Activated = () => (
    <>
        <IcCheckmarkCircleFilled className="color-success" />
        <span>{c('BOSS').t`Activated`}</span>
    </>
);

const ActivationStatus: FC<{
    isActivated: boolean;
    className?: string;
}> = ({ isActivated, className }) => {
    return (
        <div className={clsx('flex items-center gap-1', className)}>
            {isActivated ? <Activated /> : <NotActivated />}
        </div>
    );
};

export default ActivationStatus;
