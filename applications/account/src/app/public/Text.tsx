import { ReactNode } from 'react';
import { classnames } from '@proton/components';

interface Props {
    margin?: 'small';
    children: ReactNode;
    className?: string;
}

const Text = ({ children, margin, className }: Props) => {
    return (
        <div className={classnames([margin === 'small' ? 'mb1' : 'mb1-75', 'text-break color-weak', className])}>
            {children}
        </div>
    );
};

export default Text;
