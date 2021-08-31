import { HTMLAttributes, ReactNode } from 'react';

export interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
}

const Header = ({ children, ...rest }: Props) => {
    return (
        <header className="header flex flex-nowrap reset4print" {...rest}>
            {children}
        </header>
    );
};

export default Header;
