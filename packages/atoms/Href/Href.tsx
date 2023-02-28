import { ComponentPropsWithRef, ReactNode, Ref, forwardRef } from 'react';

export interface HrefProps extends ComponentPropsWithRef<'a'> {
    children: ReactNode;
}

const Href = (
    { href = '#', target = '_blank', rel = 'noopener noreferrer nofollow', children, ...rest }: HrefProps,
    ref: Ref<HTMLAnchorElement>
) => (
    <a href={href} target={target} rel={rel} ref={ref} {...rest}>
        {children}
    </a>
);

export default forwardRef<HTMLAnchorElement, HrefProps>(Href);
