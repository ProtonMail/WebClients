import { ReactNode } from 'react';
import { classnames } from '../../../../helpers';

interface Props {
    className?: string;
    children: ReactNode;
}

export const ContactViewProperties = ({ className, children }: Props) => {
    return <div className={classnames(['border-bottom mb0-5 pb0-25', className])}>{children}</div>;
};
