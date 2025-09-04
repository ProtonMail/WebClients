import type { FC, PropsWithChildren } from 'react';

import clsx from '@proton/utils/clsx';

import './OnboardingCard.scss';

type Props = { className?: string };
export const OnboardingCard: FC<PropsWithChildren<Props>> = ({ className, children }) => (
    <div className={clsx('pass-onboarding--card flex rounded-xl flex-nowrap py-4 px-6 border border-weak', className)}>
        {children}
    </div>
);
