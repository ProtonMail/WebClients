import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

export interface HrefProps extends ComponentPropsWithRef<'a'> {
    children: ReactNode;
}

const HrefBase = (
    { href = '#', target = '_blank', rel = 'noopener noreferrer nofollow', children, ...rest }: HrefProps,
    ref: Ref<HTMLAnchorElement>
) => (
    <a href={href} target={target} rel={rel} ref={ref} className={clsx('link link-focus', rest.className)} {...rest}>
        {children}
    </a>
);

export const Href = forwardRef<HTMLAnchorElement, HrefProps>(HrefBase);
