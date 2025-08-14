import type { FC, PropsWithChildren, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import './InlineFieldBox.scss';

type Props = PropsWithChildren & {
    className?: string;
    label: ReactNode;
    size?: 'sm' | 'md' | 'lg';
    childrenClassName?: string;
};

export const InlineFieldBox: FC<Props> = ({ label, children, size = 'sm', className = '', childrenClassName = '' }) => (
    <div className={clsx('pass-inline-field-box', size, className)}>
        <label>{label}</label>
        <div className={clsx('flex items-center justify-end', childrenClassName)}>{children}</div>
    </div>
);
