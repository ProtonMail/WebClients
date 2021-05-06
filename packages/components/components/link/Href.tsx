import React from 'react';

export interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    url?: string;
    target?: string;
    rel?: string;
    children?: React.ReactNode;
}

const Href = (
    { url = '#', target = '_blank', rel = 'noopener noreferrer nofollow', children, ...rest }: Props,
    ref: React.Ref<HTMLAnchorElement>
) => (
    <a href={url} target={target} rel={rel} ref={ref} {...rest}>
        {children}
    </a>
);

export default React.forwardRef<HTMLAnchorElement, Props>(Href);
