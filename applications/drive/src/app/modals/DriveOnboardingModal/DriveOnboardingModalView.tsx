import type { ReactNode } from 'react';

import type { ModalStateProps } from '@proton/components';
import { Loader, ModalTwo, ModalTwoContent, ModalTwoFooter } from '@proton/components';

import { Header } from './Header';

export type DriveOnboardingModalViewProps = ModalStateProps & {
    isLoading: boolean;
    step: number;
    steps: [() => ReactNode, () => ReactNode, any?][];
    onNext: () => Promise<void>;
    onBack: (() => void) | undefined;
};

export const DriveOnboardingModalView = ({
    isLoading,
    step,
    steps,
    onNext,
    onBack,
    ...modalProps
}: DriveOnboardingModalViewProps) => {
    if (isLoading) {
        return (
            <ModalTwo open fullscreenOnMobile blurBackdrop size="xlarge">
                <ModalTwoContent className="my-8">
                    <div className="flex flex-column items-center">
                        <Loader size="medium" className="my-4" />
                    </div>
                </ModalTwoContent>
            </ModalTwo>
        );
    }

    const [Container, Buttons, extraProps] = steps[step] || [];

    return (
        <ModalTwo {...modalProps} fullscreenOnMobile blurBackdrop size="xlarge" data-testid="drive-onboarding-v2">
            <ModalTwoContent className="my-8">
                <Header currentStep={step} maxSteps={steps.length} onBack={onBack} />
                <Container {...extraProps} onNext={onNext} />
            </ModalTwoContent>

            <ModalTwoFooter>
                <Buttons {...extraProps} onNext={onNext} />
            </ModalTwoFooter>
        </ModalTwo>
    );
};
