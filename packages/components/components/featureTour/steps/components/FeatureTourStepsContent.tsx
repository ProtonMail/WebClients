import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import clsx from '@proton/utils/clsx';

import type { FeatureTourStepProps } from '../../interface';

interface FeatureTourStepsContentProps extends FeatureTourStepProps {
    bullets?: ReactNode;
    children?: ReactNode;
    ctaText?: string;
    description?: ReactNode;
    descriptionClassName?: string;
    illustration?: string;
    illustrationSize?: 'small' | 'medium' | 'full';
    onNext: () => void;
    primaryButton?: ReactNode;
    title: string | ReactNode;
    titleClassName?: string;
}

const FeatureTourStepsContent = ({
    bullets,
    children,
    description,
    descriptionClassName,
    illustration,
    illustrationSize,
    onNext,
    primaryButton,
    title,
    titleClassName,
    ctaText,
}: FeatureTourStepsContentProps) => {
    const isFullSize = illustrationSize === 'full';
    const isMediumSize = illustrationSize === 'medium';

    return (
        <>
            <ModalHeader
                closeButtonProps={{
                    className: isFullSize ? 'modal-two-close-button--illustration-cover' : undefined,
                }}
            />
            {Boolean(illustration) && (
                <div className={'relative text-center modal-two-illustration-container'}>
                    <img
                        src={illustration}
                        alt=""
                        // eslint-disable-next-line no-nested-ternary
                        width={isFullSize ? undefined : isMediumSize ? '180' : undefined}
                        height={isFullSize ? undefined : '128'}
                        className={isFullSize ? 'w-full' : 'mt-8'}
                    />
                </div>
            )}
            <div className="modal-two-content-container">
                <ModalContent className="my-8">
                    <h1
                        className={clsx(
                            !isFullSize && !titleClassName && 'pt-8',
                            'text-lg text-bold text-center mb-0 mb-2',
                            titleClassName
                        )}
                    >
                        {title}
                    </h1>

                    {!!description && (
                        <p className={clsx('text-center mt-0 mb-4 color-weak', descriptionClassName)}>{description}</p>
                    )}

                    {children}

                    {primaryButton}

                    <Button className="mb-3" color={primaryButton ? 'weak' : 'norm'} fullWidth onClick={onNext}>
                        {ctaText || (primaryButton ? c('Button').t`Maybe later` : c('Button').t`Next`)}
                    </Button>

                    {bullets}
                </ModalContent>
            </div>
        </>
    );
};

export default FeatureTourStepsContent;
