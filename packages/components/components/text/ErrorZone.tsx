import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    children: ReactNode;
    id?: string;
    className?: string;
}
const ErrorZone = ({ children, id, className }: Props) => {
    return (
        <div className={clsx(['color-danger error-zone', className])} id={id}>
            {children}
        </div>
    );
};

export default ErrorZone;
