import { CircleLoader } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import Icon from '../icon/Icon';

const getStepIcon = (isCurrentStep: boolean, isFutureStep: boolean) => {
    if (isCurrentStep) {
        return <CircleLoader size="small" className="ml-1" />;
    }

    if (isFutureStep) {
        return null;
    }

    return <Icon size={6} className="color-success" name="checkmark" />;
};

/**
 * Display the loading or completed status of a set of steps.
 */
const LoadingTextStepper = ({
    steps,
    stepIndex,
    hideFutureSteps,
}: {
    steps: string[];
    stepIndex: number;
    hideFutureSteps: boolean;
}) => {
    return (
        <>
            {steps.map((step, i) => {
                const isCurrentStep = i === stepIndex;
                const isFutureStep = i > stepIndex;
                const isVisibleStep = !isFutureStep || !hideFutureSteps;
                if (!isVisibleStep) {
                    return null;
                }

                return (
                    <div className="text-lg" key={step}>
                        <div
                            className={clsx(
                                'flex *:min-size-auto items-center flex-nowrap',
                                isCurrentStep && 'color-primary',
                                isFutureStep && 'color-hint'
                            )}
                        >
                            <div className="mr-2 min-w-custom flex shrink-0" style={{ '--min-w-custom': '2em' }}>
                                {getStepIcon(isCurrentStep, isFutureStep)}
                            </div>
                            <div className="flex-1 p-2 text-left">{step}</div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default LoadingTextStepper;
