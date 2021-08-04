import * as React from 'react';

interface Props {
    children: React.ReactNode;
}

const ScrollShadows = ({ children }: Props) => {
    return (
        <div className="relative">
            <div className="scrollshadow-sticky scrollshadow-sticky--top" aria-hidden="true" />
            <div className="scrollshadow-static scrollshadow-static--top" aria-hidden="true" />
            {children}
            <div className="scrollshadow-sticky scrollshadow-sticky--bottom" aria-hidden="true" />
            <div className="scrollshadow-static scrollshadow-static--bottom" aria-hidden="true" />
        </div>
    );
};

export default ScrollShadows;
