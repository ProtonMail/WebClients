import { ComponentPropsWithoutRef } from 'react';
import { classnames } from '../../helpers';

interface Props extends ComponentPropsWithoutRef<'div'> {}

const TopNavbar = ({ children, className, ...rest }: Props) => {
    return (
        <div
            className={classnames([
                'flex flex-justify-end topnav-container on-mobile-no-flex flex-item-centered-vert flex-item-fluid no-print',
                className,
            ])}
            {...rest}
        >
            {children}
        </div>
    );
};

export default TopNavbar;
