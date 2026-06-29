import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import type { ModalProps } from '@proton/components';
import { ModalContent, ModalTwo, ModalTwoFooter, StepDot, StepDots } from '@proton/components';
import { IcCross } from '@proton/icons/icons/IcCross';
import blurBackground from '@proton/styles/assets/img/lumo/lumo-whats-new/blur.svg';
import clsx from '@proton/utils/clsx';
import range from '@proton/utils/range';

import { LumoIcon } from '../LumoIcon/LumoIcon';
import type { FeaturePoint, WhatsNewModalFeature, WhatsNewStageImageScale } from './types';

import './WhatsNew.scss';

interface WhatsNewModalProps extends ModalProps {
    feature: WhatsNewModalFeature;
    onCallToAction: () => void;
    onCancel: () => void;
}

const WhatsNewModal = ({ feature, onCallToAction, onCancel, open, ...modalProps }: WhatsNewModalProps) => {
    const [step, setStep] = useState(0);
    const stages = feature.stages;
    const currentStage = stages[step];
    const isFirstStep = step === 0;
    const isLastStep = step === stages.length - 1;
    const imageScale: WhatsNewStageImageScale = currentStage?.imageScale ?? 'lg';

    useEffect(() => {
        if (open) {
            setStep(0);
        }
    }, [open]);

    if (!currentStage) {
        return null;
    }

    const handleNext = () => {
        if (isLastStep) {
            onCallToAction();
            return;
        }
        setStep((currentStep) => currentStep + 1);
    };

    const handleBack = () => {
        setStep((currentStep) => Math.max(0, currentStep - 1));
    };

    const nextButtonLabel = (() => {
        if (isLastStep) {
            return c('collider_2025: Button').t`Get started`;
        }
        if (isFirstStep) {
            return c('collider_2025: Button').t`Continue`;
        }
        return c('collider_2025: Button').t`Next`;
    })();

    const renderFeaturePoints = () => {
        if (!currentStage.getFeaturePoints) {
            return null;
        }

        return (
            <ul className="unstyled my-0">
                {currentStage.getFeaturePoints().map((point: FeaturePoint) => (
                    <li key={point.icon} className="feature-point flex flex-nowrap items-center gap-3 my-2">
                        <LumoIcon name={point.icon} className="shrink-0" size={16} />
                        <span>{point.getText()}</span>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <ModalTwo
            size="large"
            className="whats-new-modal"
            rootClassName="whats-new-modal-root"
            enableCloseWhenClickOutside
            {...modalProps}
            open={open}
        >
            <Tooltip title={c('collider_2025:Action').t`Close`}>
                <button
                    type="button"
                    className="whats-new-modal-close inline-flex items-center justify-center border bg-norm color-norm"
                    onClick={onCancel}
                    aria-label={c('collider_2025:Action').t`Close`}
                >
                    <IcCross size={4} />
                </button>
            </Tooltip>
            <div className="whats-new-modal-shell">
                <div className="whats-new-modal-illustration flex items-center justify-center">
                    <img src={blurBackground} alt="" className="whats-new-modal-illustration-blur" aria-hidden="true" />
                    {currentStage.image && (
                        <img
                            src={currentStage.image}
                            alt={currentStage.imageAlt ?? ''}
                            className={clsx(
                                'whats-new-modal-illustration-image',
                                `whats-new-modal-illustration-image--${imageScale}`
                            )}
                        />
                    )}
                </div>
                <ModalContent>
                    <div className="whats-new-content">
                        <div className="flex flex-column flex-nowrap gap-2">
                            <span className="whats-new-badge">{c('collider_2025: Feature').t`What's new`}</span>
                            <h2 className="whats-new-title text-2xl text-semibold m-0">{currentStage.getTitle()}</h2>
                            {currentStage.getDescription && (
                                <p className="m-0 color-weak">{currentStage.getDescription()}</p>
                            )}
                            {renderFeaturePoints()}
                        </div>
                    </div>
                </ModalContent>
                <ModalTwoFooter>
                    <div className="whats-new-modal-footer flex flex-row flex-nowrap items-center justify-space-between w-full gap-4">
                        {stages.length > 1 ? (
                            <StepDots value={step} ulClassName="mb-0">
                                {range(0, stages.length).map((index) => (
                                    <StepDot
                                        active={index === step}
                                        key={stages[index].id}
                                        index={index}
                                        aria-controls={`whats-new-${stages[index].id}`}
                                        onClick={() => {
                                            setStep(index);
                                        }}
                                    />
                                ))}
                            </StepDots>
                        ) : (
                            <span />
                        )}
                        <div className="flex flex-row flex-nowrap gap-2 shrink-0">
                            {isFirstStep ? (
                                <Button size="medium" shape="outline" onClick={onCancel}>{c('collider_2025: Button')
                                    .t`Skip`}</Button>
                            ) : (
                                <Button size="medium" shape="outline" onClick={handleBack}>{c('collider_2025: Button')
                                    .t`Back`}</Button>
                            )}
                            <Button size="medium" color="norm" onClick={handleNext}>
                                {nextButtonLabel}
                            </Button>
                        </div>
                    </div>
                </ModalTwoFooter>
            </div>
        </ModalTwo>
    );
};

export default WhatsNewModal;
