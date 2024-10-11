import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './SecurityCheckupCard.scss';

const SecurityCheckupCard = ({ className, children }: { className?: string; children: ReactNode }) => {
    return <div className={clsx('security-checkup-card bg-norm', className)}>{children}</div>;
};

export default SecurityCheckupCard;
