import { ComponentPropsWithRef, ReactNode, Ref, forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

export interface HrefProps extends ComponentPropsWithRef<'a'> {
    children: ReactNode;
}

const Href = (
    { href = '#', target = '_blank', rel = 'noopener noreferrer nofollow', children, ...rest }: HrefProps,
    ref: Ref<HTMLAnchorElement>
) => (
    <a href={href} target={target} rel={rel} ref={ref} className={clsx('link link-focus', rest.className)} {...rest}>
        {children}
    </a>
);

export default forwardRef<HTMLAnchorElement, HrefProps>(Href);
