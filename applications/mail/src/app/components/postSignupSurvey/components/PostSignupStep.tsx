import { clsx } from 'clsx';
import { c } from 'ttag';

interface Props {
    steps: number;
    currentStep: number;
}

export const PostSignupStep = ({ steps, currentStep }: Props) => {
    const header = c('Info').t`${currentStep} of ${steps}`;
    const stepsArray = Array.from({ length: steps }, (_, i) => i + 1);

    return (
        <div className="flex items-center mb-4">
            {stepsArray.map((step, i) => (
                <span
                    key={step}
                    className={clsx(
                        'h-custom w-custom rounded-full',
                        i < currentStep ? 'bg-primary' : 'bg-weak',
                        i < stepsArray.length - 1 ? 'mr-1' : ''
                    )}
                    style={{ '--h-custom': '0.25rem', '--w-custom': '1.5rem' }}
                />
            ))}
            <span className="ml-2 color-weak text-semibold text-sm">{header}</span>
        </div>
    );
};
