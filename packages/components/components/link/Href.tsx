import { AnchorHTMLAttributes, forwardRef, ReactNode, Ref } from 'react';

export interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
    url?: string;
    target?: string;
    rel?: string;
    children?: ReactNode;
}

const Href = (
    { url = '#', target = '_blank', rel = 'noopener noreferrer nofollow', children, ...rest }: Props,
    ref: Ref<HTMLAnchorElement>
) => (
    <a href={url} target={target} rel={rel} ref={ref} {...rest}>
        {children}
    </a>
);

export default forwardRef<HTMLAnchorElement, Props>(Href);
