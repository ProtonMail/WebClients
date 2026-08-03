import { clsx } from 'clsx';
import { c } from 'ttag';

interface Props {
    activeStep: 1 | 2;
}

export const PaperTrailStepper = ({ activeStep }: Props) => {
    const steps = [
        { num: 1, label: c('collider_2025:Label').t`Platform` },
        { num: 2, label: c('collider_2025:Label').t`Upload` },
    ];

    return (
        <div className="ai-paper-trail__stepper" aria-label={c('collider_2025:Label').t`Progress`}>
            {steps.map((step, index) => {
                const isActive = step.num === activeStep;
                const isComplete = step.num < activeStep;

                return (
                    <div key={step.num} className="ai-paper-trail__stepper-item">
                        {index > 0 && (
                            <span
                                className={clsx(
                                    'ai-paper-trail__stepper-line',
                                    (isActive || isComplete) && 'is-active'
                                )}
                                aria-hidden="true"
                            />
                        )}
                        <div
                            className={clsx(
                                'ai-paper-trail__stepper-step',
                                isActive && 'is-active',
                                isComplete && 'is-complete'
                            )}
                        >
                            <span className="ai-paper-trail__stepper-num">{step.num}</span>
                            <span className="ai-paper-trail__stepper-label">{step.label}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
