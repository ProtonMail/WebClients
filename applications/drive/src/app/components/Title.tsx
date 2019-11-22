import React from 'react';

interface Props {
    children: React.ReactNode;
}

const Title = ({ children }: Props) => {
    return <h1 className="sticky-title mb0">{children}</h1>;
};

export default Title;
