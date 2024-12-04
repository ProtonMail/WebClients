import type { FC, PropsWithChildren, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './InlineFieldBox.scss';

type Props = PropsWithChildren & { label: ReactNode; size?: 'sm' | 'md' | 'lg' };

export const InlineFieldBox: FC<Props> = ({ label, children, size = 'sm' }) => (
    <div className={clsx('pass-inline-field-box', size)}>
        <label>{label}</label>
        <div className="flex items-center justify-end">{children}</div>
    </div>
);
