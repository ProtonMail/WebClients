import React from 'react';

interface Props extends React.HTMLProps<HTMLDivElement> {
    children: React.ReactNode;
}

const Content = ({ children, className, ...rest }: Props) => {
    return (
        <div className="sign-layout-main-content" {...rest}>
            {children}
        </div>
    );
};

export default Content;
