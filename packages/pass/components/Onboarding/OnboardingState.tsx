import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import { useOnboarding } from './OnboardingProvider';

export const OnboardingState: FC<{ className?: string }> = ({ className }) => {
    const { steps, launch, acknowledge, completed } = useOnboarding();

    return (
        <div className="relative px-3">
            <Button
                icon
                pill
                shape="ghost"
                color="weak"
                size="small"
                onClick={acknowledge}
                className="absolute top-0 right-0 mx-4 mt-1"
            >
                <Icon name="cross-circle-filled" alt={c('Action').t`Close`} />
            </Button>
            <Button
                onClick={launch}
                shape="ghost"
                className={clsx('w-full shrink-0 border border-weak rounded-lg bg-weak ', className)}
            >
                <div className="flex justify-space-between items-center">
                    <div className="text-lg text-semibold">{c('Label').t`Get Started`}</div>
                </div>
                {steps.map(({ key, shortTitle }) => (
                    <div key={key} className="w-full text-left flex flex-nowrap gap-2 items-start mt-2">
                        <div className="shrink-0">
                            {completed.includes(key) ? (
                                <Icon name="checkmark-circle-filled" color="var(--signal-success)" />
                            ) : (
                                <Icon name="circle" />
                            )}
                        </div>
                        <div>{shortTitle}</div>
                    </div>
                ))}
            </Button>
        </div>
    );
};
