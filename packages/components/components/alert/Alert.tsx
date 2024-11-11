import type { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

export type AlertType = 'info' | 'error' | 'warning' | 'success';

type ClassesMap = { [key in AlertType]: string };

const classesMap: ClassesMap = {
    info: 'alert-block',
    warning: 'alert-block--warning',
    error: 'alert-block--danger',
    success: 'alert-block--success',
};

interface AlertProps {
    type?: AlertType;
    children?: ReactNode;
    className?: string;
    'data-testid'?: string;
    style?: React.CSSProperties;
}

/**
 * @deprecated please use Banner from @proton/atoms
 */
const Alert = ({ type = 'info', children, className, 'data-testid': dataTestId, ...rest }: AlertProps) => {
    return (
        <div className={clsx(classesMap[type], className)} data-testid={dataTestId} {...rest}>
            {children}
        </div>
    );
};

export default Alert;
