import { useEffect, useState } from 'react';

import { completedFeatureTourAction } from '@proton/account/featuresTour/actions';
import { useDispatch } from '@proton/redux-shared-store';

import FeatureTourLoader from './FeatureTourLoader';
import { FEATURE_TOUR_STEPS_MAP } from './constants';
import type { FeatureTourStepId } from './interface';

export type TourStep = {
    id: FeatureTourStepId;
    isActive: boolean;
};

interface StepBulletProps {
    steps: TourStep[];
    onClick: (stepIdx: FeatureTourStepId) => void;
}

const StepsBullet = ({ steps, onClick }: StepBulletProps) => (
    <div className="flex justify-center">
        {steps.map(({ id, isActive }) => (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div
                key={id}
                data-testid={`step-bullet-${id}`}
                className={`w-2 h-2 rounded-full mx-1 ${isActive ? 'bg-primary' : 'bg-weak'}`}
                onClick={() => onClick(id)}
            />
        ))}
    </div>
);

const FeatureTourSteps = ({
    onFinishTour,
    stepsList,
}: {
    onFinishTour: () => void;
    stepsList: FeatureTourStepId[];
}) => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [steps, setSteps] = useState<TourStep[]>([]);

    useEffect(() => {
        const initSteps = async () => {
            const initializedSteps = await Promise.all(
                stepsList.map(async (id) => {
                    const shouldDisplay = FEATURE_TOUR_STEPS_MAP[id].shouldDisplay;
                    const isVisible = await shouldDisplay(dispatch);
                    return { id, isVisible };
                })
            );

            const steps: TourStep[] = initializedSteps
                .filter(({ isVisible }) => isVisible)
                .map((step, index) => ({ ...step, isActive: index === 0 }));

            setSteps(steps);
            setIsLoading(false);
        };

        void initSteps();
    }, []);

    const handleNextStep = () => {
        const activeStepId = steps.find(({ isActive }) => isActive)?.id;
        const isLastStep = steps[steps.length - 1].id === activeStepId;

        if (isLastStep) {
            onFinishTour();
            void dispatch(completedFeatureTourAction());
        } else {
            const activeStepIdx = steps.findIndex(({ isActive }) => isActive);
            const nextVisibleStepId = steps[activeStepIdx + 1].id;
            const nextSteps = steps.map((step) => {
                const isActive = step.id === nextVisibleStepId;
                return { ...step, isActive };
            });
            setSteps(nextSteps);
        }
    };

    const handleBulletClick = (stepId: TourStep['id']) => {
        const nextSteps = steps.map((step) => {
            const isActive = step.id === stepId;
            return { ...step, isActive };
        });
        setSteps(nextSteps);
    };

    const ActiveStepComponent = () => {
        const activeStepId = steps.find(({ isActive }) => isActive)?.id;
        if (!activeStepId) {
            return null;
        }

        const StepComponent = FEATURE_TOUR_STEPS_MAP[activeStepId].component;
        return (
            <StepComponent
                onNext={handleNextStep}
                isActive={true}
                bullets={<StepsBullet steps={steps} onClick={handleBulletClick} />}
            />
        );
    };

    return (
        <>
            {isLoading && <FeatureTourLoader />}
            <ActiveStepComponent />
        </>
    );
};

export default FeatureTourSteps;
