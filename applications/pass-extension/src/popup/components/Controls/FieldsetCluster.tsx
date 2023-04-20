import { type FC } from 'react';

import clsx from '@proton/utils/clsx';

import './FieldsetCluster.scss';

type Props = { as?: 'fieldset' | 'div' | 'span'; mode?: 'read' | 'write' };

export const FieldsetCluster: FC<Props> = ({ children, as = 'fieldset', mode = 'write' }) => {
    const Component = as;
    return (
        <Component
            className={clsx(
                'pass-fieldset-cluster border-none rounded-xl p-0 m-0 mb-2',
                mode === 'write' ? 'pass-fieldset-cluster--write' : 'pass-fieldset-cluster--read'
            )}
            style={mode === 'write' ? { background: 'var(--field-norm)' } : undefined}
        >
            {children}
        </Component>
    );
};
