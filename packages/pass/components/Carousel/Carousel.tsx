import { type CSSProperties, type ComponentPropsWithoutRef, type FC, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import './Carousel.scss';

type CarouselProps = ComponentPropsWithoutRef<'div'> & {
    steps: { image: string; title: string; description: string }[];
    textClassName?: string;
    textStyle?: CSSProperties;
};

export const Carousel: FC<CarouselProps> = ({ steps, className, textClassName, textStyle, ...rest }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const onStepChange = (offset: number) => {
        const nextIndex = (currentStep + offset + steps.length) % steps.length;
        setCurrentStep(nextIndex);
    };

    return (
        <div className={clsx('pass-carousel', className)} {...rest}>
            <img src={steps[currentStep].image} className="pass-carousel--image w-full mb-4" alt="" />

            <div className="pass-carousel--stepper mb-6">
                {steps.map((_, i) => (
                    <Button
                        key={`step-${i}`}
                        shape="ghost"
                        className={clsx(i === currentStep && 'selected')}
                        onClick={() => onStepChange(i - currentStep)}
                    />
                ))}
            </div>

            <div className={clsx('pass-carousel--text', textClassName)} style={textStyle}>
                <p className="m-0 mb-2 text-bold text-lg">{steps[currentStep].title}</p>
                <p className="m-0 color-weak">{steps[currentStep].description}</p>
            </div>

            <div className="pass-carousel--nav">
                <Button shape="solid" onClick={() => onStepChange(-1)}>
                    <Icon name="chevron-left" alt={c('Action').t`Previous`} />
                </Button>
                <Button shape="solid" onClick={() => onStepChange(1)}>
                    <Icon name="chevron-right" alt={c('Action').t`Next`} />
                </Button>
            </div>
        </div>
    );
};
