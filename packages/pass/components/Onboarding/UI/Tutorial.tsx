import type { FC, PropsWithChildren } from 'react';

import clsx from '@proton/utils/clsx';

import './Tutorial.scss';

type Props = {
    className?: string;
};

export const Tutorial: FC<PropsWithChildren<Props>> = ({ children, className }) => (
    <ol className={clsx('pass-onboarding-tutorial text-xl py-0 m-0', className)}>{children}</ol>
);
