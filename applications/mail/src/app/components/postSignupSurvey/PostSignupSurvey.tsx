import { useEffect, useRef, useState } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { Card } from '@proton/atoms/Card/Card';
import { Portal } from '@proton/atoms/Portal/Portal';
import {
    type JoinReason,
    type PreviousProvider,
    dismissOnboardingSurvey,
    submitOnboardingSurvey,
} from '@proton/shared/lib/api/onboardingSurvey';
import noop from '@proton/utils/noop';

import { PostSignupStep1 } from './PostSignupStep1';
import { PostSignupStep2 } from './PostSignupStep2';

import './PostSignupSurvey.scss';

interface FormState {
    joinReason?: JoinReason;
    joinReasonDetail?: string;
    providers: PreviousProvider[];
    providerDetail?: string;
}

const INITIAL_FORM: FormState = { joinReasonDetail: undefined, providers: [] };

interface Props {
    /** Called once, when the survey is dismissed or submitted */
    onClose: () => void;
}

export const PostSignupSurvey = ({ onClose }: Props) => {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormState>(INITIAL_FORM);

    const api = useApi();
    const isClosedRef = useRef(false);

    // The outcome is final once reported, a failing request must never keep the user stuck on the survey
    const handleDismiss = () => {
        if (isClosedRef.current) {
            return;
        }
        isClosedRef.current = true;

        api({ ...dismissOnboardingSurvey(), silence: true }).catch(noop);
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
        setForm({ ...form, joinReason, joinReasonDetail });
        setStep(1);
    };

    const handleSubmitStepTwo = (providers: PreviousProvider[], providerDetail?: string) => {
        if (isClosedRef.current) {
            return;
        }
        isClosedRef.current = true;

        // Step 2 is only reachable after step 1, so a missing reason is a dismissal
        if (!form.joinReason) {
            onClose();
            return;
        }

        api({
            ...submitOnboardingSurvey({
                JoinReason: form.joinReason,
                PreviousProviders: providers,
                JoinReasonDetail: form.joinReasonDetail,
                // Only the 'other' provider requires a detail
                PreviousProviderDetail: providers.includes('other') ? providerDetail : undefined,
            }),
            silence: true,
        }).catch(noop);
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
                    <PostSignupStep1
                        onSubmit={handleSubmitStepOne}
                        onDismiss={handleDismiss}
                        initialReason={form.joinReason}
                        initialDetail={form.joinReasonDetail}
                    />
                )}
                {step === 1 && <PostSignupStep2 onSubmit={handleSubmitStepTwo} onBack={handleBackStepTwo} />}
            </Card>
        </Portal>
    );
};
