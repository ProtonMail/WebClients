import { ReactNode } from 'react';
import { classnames } from '../../helpers';

interface Props {
    children?: ReactNode;
    className?: string;
}

const ProminentContainer = ({ children, className }: Props) => {
    return <div className={classnames(['ui-prominent bg-norm color-norm h100', className])}>{children}</div>;
};

export default ProminentContainer;
