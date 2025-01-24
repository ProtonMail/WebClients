import type { FeatureTourStep, FeatureTourStepId } from '@proton/components/components/featureTour/interface';
import StepDot from '@proton/components/components/stepDot/StepDot';
import StepDots from '@proton/components/components/stepDots/StepDots';

export interface FeatureTourStepBulletProps {
    steps: FeatureTourStep[];
    onClick: (stepIdx: FeatureTourStepId) => void;
}

const FeatureTourStepBullets = ({ steps, onClick }: FeatureTourStepBulletProps) => (
    <StepDots ulClassName="m-0" className="text-center">
        {steps.map(({ id, isActive }) => (
            <StepDot key={id} active={isActive} data-testid={`step-bullet-${id}`} onClick={() => onClick(id)} />
        ))}
    </StepDots>
);

export default FeatureTourStepBullets;
