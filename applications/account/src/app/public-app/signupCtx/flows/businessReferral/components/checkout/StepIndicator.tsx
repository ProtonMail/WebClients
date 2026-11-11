import { Fragment } from 'react';

import { c } from 'ttag';

import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import clsx from '@proton/utils/clsx';

export type BusinessSignupStep = 1 | 2 | 3;

const getStepItems = (): { step: BusinessSignupStep; label: string }[] => [
    { step: 1, label: c('Signup').t`Business information` },
    { step: 2, label: c('Signup').t`Create account` },
    { step: 3, label: c('Signup').t`Confirmation` },
];

type StepState = 'done' | 'active' | 'upcoming';

const getStepState = (
    step: BusinessSignupStep,
    currentStep: BusinessSignupStep,
    completedSteps: BusinessSignupStep[]
): StepState => {
    if (completedSteps.includes(step)) {
        return 'done';
    }
    if (step === currentStep) {
        return 'active';
    }
    return 'upcoming';
};

const LABEL_COLOR_CLASS: Record<StepState, string> = {
    done: 'color-norm',
    active: 'color-norm',
    upcoming: 'color-weak',
};

// The `done` badge is a filled white circle with a hardcoded dark number (see layout.scss), not
// a text-color token — unlike the label, it has no entry for that state.
const BADGE_COLOR_CLASS: Partial<Record<StepState, string>> = {
    active: 'color-norm',
    upcoming: 'color-weak',
};

const StepIndicatorItem = ({ step, label, state }: { step: number; label: string; state: StepState }) => {
    const isDone = state === 'done';

    return (
        <div className="flex items-center gap-2">
            <span
                className={clsx(
                    'business-step-indicator-badge w-custom h-custom rounded-full flex items-center justify-center text-sm text-bold',
                    !isDone && 'border',
                    BADGE_COLOR_CLASS[state],
                    `is-${state}`
                )}
                style={{ '--w-custom': '1.5rem', '--h-custom': '1.5rem' }}
            >
                {step}
            </span>
            {/* Labels hidden below `md` — three full labels plus chevrons don't fit a mobile row without wrapping mid-step, so mobile shows just the connected numbered badges. */}
            <span className={clsx('hidden md:inline text-sm', LABEL_COLOR_CLASS[state])}>{label}</span>
        </div>
    );
};

interface Props {
    currentStep: BusinessSignupStep;
    /** Steps to render as "done" (filled badge) — explicit rather than `step < currentStep`, since that's not always true. Defaults to none completed. */
    completedSteps?: BusinessSignupStep[];
}

/** Both native checkout screens (account-details, payment) map to `currentStep={2}`, since Figma groups them under one "Create account" step. */
export const StepIndicator = ({ currentStep, completedSteps = [] }: Props) => {
    const items = getStepItems();

    return (
        <div className="flex items-center justify-center gap-6">
            {items.map((item, index) => (
                <Fragment key={item.step}>
                    <StepIndicatorItem
                        step={item.step}
                        label={item.label}
                        state={getStepState(item.step, currentStep, completedSteps)}
                    />
                    {index < items.length - 1 && <IcChevronRight size={4} className="color-weak shrink-0" />}
                </Fragment>
            ))}
        </div>
    );
};
