import React from 'react';

interface Props extends React.HTMLProps<HTMLDetailsElement> {
    children: React.ReactNode;
    open?: boolean;
}

const Details = ({ children, open = false, ...props }: Props) => (
    <details open={open} {...props}>
        {children}
    </details>
);

export default Details;
