import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './SecurityCheckupMain.scss';

interface Props {
    className?: string;
    children?: ReactNode;
}

const SecurityCheckupMain = ({ children, className }: Props) => {
    return (
        <div className="w-full max-w-custom mx-auto" style={{ '--max-w-custom': '32rem' }}>
            <div
                className={clsx('security-checkup-main', 'bg-norm rounded-lg sm:shadow-norm', 'p-0 sm:p-11', className)}
            >
                {children}
            </div>
        </div>
    );
};

export default SecurityCheckupMain;
