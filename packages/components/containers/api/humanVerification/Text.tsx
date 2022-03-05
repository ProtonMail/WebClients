import { ReactNode } from 'react';
import { classnames } from '../../../helpers';

interface Props {
    className?: string;
    children: ReactNode;
}

const Text = ({ children, className }: Props) => {
    return <div className={classnames(['mb1-75 color-weak text-break', className])}>{children}</div>;
};

export default Text;
