import { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';
import { classnames } from '../../helpers';

interface Props extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    children?: ReactNode;
    className?: string;
    collapseOnMobile?: boolean;
}

const Row = ({ children, className = '', collapseOnMobile = true, ...rest }: Props) => {
    return (
        <div
            className={classnames(['flex flex-nowrap mb1', collapseOnMobile && 'on-mobile-flex-column', className])}
            {...rest}
        >
            {children}
        </div>
    );
};

export default Row;
