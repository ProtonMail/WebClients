import { useEffect, useState } from 'react';

import { completedFeatureTourAction } from '@proton/account/featuresTour/actions';
import { useDispatch } from '@proton/redux-shared-store';

import FeatureTourLoader from './FeatureTourLoader';
import { FEATURE_TOUR_STEPS_MAP } from './constants';
import type { FeatureTourStep, FeatureTourStepId } from './interface';
import FeatureTourStepBullets from './steps/components/FeatureTourStepBullets';

const FeatureTourSteps = ({
    onFinishTour,
    stepsList,
}: {
    onFinishTour: () => void;
    stepsList: FeatureTourStepId[];
}) => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [preloadUrls, setPreloadUrls] = useState<string[]>([]);
    const [steps, setSteps] = useState<FeatureTourStep[]>([]);

    useEffect(() => {
        const initSteps = async () => {
            const urlsToPreload: Set<string> = new Set();
            const initializedSteps = await Promise.all(
                stepsList.map(async (id) => {
                    const shouldDisplay = FEATURE_TOUR_STEPS_MAP[id].shouldDisplay;
                    const { canDisplay, preloadUrls } = await shouldDisplay(dispatch);

                    if (canDisplay && preloadUrls) {
                        preloadUrls.forEach((url) => urlsToPreload.add(url));
                    }

                    return { id, isVisible: canDisplay };
                })
            );

            const steps: FeatureTourStep[] = initializedSteps
                .filter(({ isVisible }) => isVisible)
                .map((step, index) => ({ ...step, isActive: index === 0 }));

            setSteps(steps);
            setPreloadUrls(Array.from(urlsToPreload));
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

    const handleBulletClick = (stepId: FeatureTourStep['id']) => {
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
                bullets={<FeatureTourStepBullets steps={steps} onClick={handleBulletClick} />}
            />
        );
    };

    return (
        <>
            {isLoading && <FeatureTourLoader />}
            <ActiveStepComponent />
            {preloadUrls.map((url) => (
                <link key={url} rel="prefetch" href={url} as="image" />
            ))}
        </>
    );
};

export default FeatureTourSteps;
