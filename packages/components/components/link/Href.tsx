import React from 'react';

interface Props extends React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {
    url?: string;
    target?: string;
    rel?: string;
    children?: React.ReactNode;
}

const Href = ({ url = '#', target = '_blank', rel = 'noopener noreferrer', children, ...rest }: Props) => (
    <a href={url} target={target} rel={rel} {...rest}>
        {children}
    </a>
);

export default Href;
