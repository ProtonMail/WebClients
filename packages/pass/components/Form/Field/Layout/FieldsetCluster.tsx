import type { FC, PropsWithChildren } from 'react';

import clsx from '@proton/utils/clsx';

import './FieldsetCluster.scss';

type Props = PropsWithChildren<{
    as?: 'fieldset' | 'div' | 'span';
    className?: string;
    mode?: 'read' | 'write';
}>;

export const FieldsetCluster: FC<Props> = ({ as: Component = 'fieldset', children, className, mode = 'write' }) => (
    <Component
        className={clsx(
            'pass-fieldset-cluster max-w-full border-none p-0 m-0 rounded-lg mb-2',
            mode === 'write' ? 'pass-fieldset-cluster--write' : 'pass-fieldset-cluster--read',
            className
        )}
        style={mode === 'write' ? { background: 'var(--field-norm)' } : undefined}
    >
        {children}
    </Component>
);
