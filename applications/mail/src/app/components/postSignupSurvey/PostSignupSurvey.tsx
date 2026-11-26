import { useEffect, useRef, useState } from 'react';

import { Card } from '@proton/atoms/Card/Card';
import { Portal } from '@proton/atoms/Portal/Portal';
import type { JoinReason, PreviousProvider } from '@proton/shared/lib/api/onboardingSurvey';

import { usePostSignupSurvey } from './hooks/usePostSignupSurvey';
import { JoinReasonStep } from './steps/JoinReasonStep';

import './PostSignupSurvey.scss';
import { PreviousProviderStep } from './steps/PreviousProviderStep';

interface Props {
    /** Called once, when the survey is dismissed or submitted */
    onClose: () => void;
}

export const PostSignupSurvey = ({ onClose }: Props) => {
    const [step, setStep] = useState(0);
    const isClosedRef = useRef(false);

    const survey = usePostSignupSurvey();

    // The outcome is final once reported, a failing request must never keep the user stuck on the survey
    const handleDismiss = () => {
        if (isClosedRef.current) {
            return;
        }
        isClosedRef.current = true;

        survey.dismiss();
        onClose();
    };

    // Capture phase on document, so the click still reaches the page (e.g. Easy Switch buttons) while dismissing.
    // Listens to click, not pointerdown: dismissing refetches the checklist, which can unmount the pressed control before its onClick runs
    const handleDismissRef = useRef(handleDismiss);
    handleDismissRef.current = handleDismiss;
    useEffect(() => {
        const onClick = (event: MouseEvent) => {
            if (event.target instanceof Element && !event.target.closest('.post-signup-survey')) {
                handleDismissRef.current();
            }
        };

        document.addEventListener('click', onClick, true);
        return () => document.removeEventListener('click', onClick, true);
    }, []);

    const handleSubmitStepOne = (joinReason: JoinReason, joinReasonDetail?: string) => {
        survey.saveAnswers({ JoinReasons: [joinReason], JoinReasonDetail: joinReasonDetail });
        setStep(1);
    };

    const handleSubmitStepTwo = (providers: PreviousProvider[], providerDetail?: string) => {
        if (isClosedRef.current) {
            return;
        }
        isClosedRef.current = true;

        // Step 2 is only reachable after step 1, so a missing reason is a dismissal
        if (!survey.form?.JoinReasons) {
            onClose();
            return;
        }

        survey.saveAnswers({ PreviousProviders: providers, PreviousProviderDetail: providerDetail });
        survey.submit();
        onClose();
    };

    const handleBackStepTwo = () => {
        setStep(0);
    };

    return (
        <Portal>
            <Card
                rounded="xl"
                bordered={false}
                background={false}
                className="post-signup-survey bg-norm shadow-lifted p-6"
            >
                {step === 0 && (
                    <JoinReasonStep
                        onSubmit={handleSubmitStepOne}
                        onDismiss={handleDismiss}
                        initialReason={survey.form?.JoinReasons?.[0]}
                        initialDetail={survey.form?.JoinReasonDetail}
                    />
                )}
                {step === 1 && <PreviousProviderStep onSubmit={handleSubmitStepTwo} onBack={handleBackStepTwo} />}
            </Card>
        </Portal>
    );
};
