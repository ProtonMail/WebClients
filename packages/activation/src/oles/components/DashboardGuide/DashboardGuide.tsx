import type { FC } from 'react';
import type React from 'react';

import { c } from 'ttag';

import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import clsx from '@proton/utils/clsx';

import useB2BOnboardingSteps from './useB2BOnboardingSteps';

const DashboardGuide: FC = () => {
    const [steps, stepsLoading] = useB2BOnboardingSteps();

    if (stepsLoading) {
        return <SkeletonLoader />;
    }

    const incompleteSteps = steps.filter((s) => s.completed !== true);

    if (!incompleteSteps.length) {
        return null;
    }

    return (
        <>
            <h2>{c('BOSS').t`Finish setting up your business account`}</h2>
            <ol className="unstyled border rounded">
                {steps.map((step, ix) => (
                    <li
                        key={step.id}
                        className={clsx(
                            ix !== steps.length - 1 && 'border-bottom',
                            'px-4 py-3 items-center justify-space-between flex'
                        )}
                    >
                        <div className="flex flex-nowrap items-center">
                            <div
                                className={clsx(
                                    step.completed ? 'bg-primary color-white' : 'color-primary',
                                    'border border-primary rounded-full mr-2 ratio-square w-custom text-xs flex items-center justify-center'
                                )}
                                style={{ '--w-custom': '1rem' }}
                            >
                                {step.completed ? <IcCheckmark /> : <span>{ix + 1}</span>}
                            </div>
                            <div className={clsx({ 'text-strike': step.completed })}>{step.text}</div>
                        </div>
                        {step.action && (
                            <step.action
                                className={clsx(
                                    step.completed && 'visibility-hidden',
                                    'text-semibold',
                                    'color-primary'
                                )}
                            />
                        )}
                    </li>
                ))}
            </ol>
        </>
    );
};

export default DashboardGuide;
