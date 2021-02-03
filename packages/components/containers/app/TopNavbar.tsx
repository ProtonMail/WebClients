import React from 'react';

import { classnames } from '../../helpers';

interface Props {
    children?: React.ReactNode;
    className?: string;
}

export const TopNavbarItem = ({ className = 'flex-item-noshrink', children }: Props) => {
    if (!React.isValidElement(children)) {
        return null;
    }
    const clonedElement = React.cloneElement(children, {
        className: 'topnav-link inline-flex flex-nowrap text-no-decoration',
    });
    return <li className={className}>{clonedElement}</li>;
};

const TopNavbar = ({ children, className = '' }: Props) => {
    const validElements = React.Children.toArray(children).filter((child) => React.isValidElement(child));
    const navIconsLength = validElements.length;
    return (
        <div
            className={classnames([
                'flex flex-justify-end topnav-container on-mobile-no-flex flex-item-centered-vert flex-item-fluid',
                className,
            ])}
        >
            <ul
                className={classnames([
                    'topnav-list unstyled mt0 mb0 ml1 flex flex-nowrap flex-align-items-center',
                    navIconsLength >= 4 && 'topnav-list--four-elements',
                ])}
            >
                {children}
            </ul>
        </div>
    );
};

export default TopNavbar;
