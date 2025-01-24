import type { FeatureTourStep, FeatureTourStepId } from '@proton/components/components/featureTour/interface';

export interface FeatureTourStepBulletProps {
    steps: FeatureTourStep[];
    onClick: (stepIdx: FeatureTourStepId) => void;
}

const FeatureTourStepBullets = ({ steps, onClick }: FeatureTourStepBulletProps) => (
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

export default FeatureTourStepBullets;
