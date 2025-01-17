import type { TourStep } from './FeatureTourSteps';
import type { FeatureTourStepId } from './interface';

interface StepCounterProps {
    steps: TourStep[];
    onClick: (stepIdx: FeatureTourStepId) => void;
}

const FeatureTourStepsBullet = ({ steps, onClick }: StepCounterProps) => (
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

export default FeatureTourStepsBullet;
