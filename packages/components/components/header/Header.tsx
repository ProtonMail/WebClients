import React from 'react';

export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
}

const Header = ({ children, ...rest }: Props) => {
    return (
        <header className="header flex flex-nowrap reset4print" {...rest}>
            {children}
        </header>
    );
};

export default Header;
