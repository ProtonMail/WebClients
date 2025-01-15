import { useEffect, useState } from 'react';

import { completedFeatureTourAction } from '@proton/account/featuresTour/actions';
import Loader from '@proton/components/components/loader/Loader';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import { useDispatch } from '@proton/redux-shared-store';

import FeatureTourStepsBullet from './FeatureTourStepsBullet';
import { FEATURE_TOUR_STEPS_MAP } from './constants';
import type { FeatureTourStepId } from './interface';

export type TourStep = {
    id: FeatureTourStepId;
    isActive: boolean;
};

const FeatureTourSteps = ({ onClose, stepsList }: { onClose: () => void; stepsList: FeatureTourStepId[] }) => {
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
            onClose();
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
                bullets={<FeatureTourStepsBullet steps={steps} onClick={handleBulletClick} />}
            />
        );
    };

    return (
        <>
            {isLoading && (
                <ModalContent
                    className="m-8 text-center min-h-custom flex items-center justify-center"
                    style={{ '--min-h-custom': '32rem' }}
                >
                    <Loader size="small" className="color-primary" />
                </ModalContent>
            )}
            <ActiveStepComponent />
        </>
    );
};

export default FeatureTourSteps;
