import { useState } from 'react';

import { Card } from '@proton/atoms/Card/Card';
import { Portal } from '@proton/atoms/Portal/Portal';

import { PostSignupStep1 } from './PostSignupStep1';
import { PostSignupStep2 } from './PostSignupStep2';
import type { JoinReason, PreviousProvider } from './interface';

import './PostSignupSurvey.scss';

interface FormState {
    joinReason?: JoinReason;
    joinReasonDetail: string;
    providers: PreviousProvider[];
    providerDetail: string;
}

const INITIAL_FORM: FormState = { joinReasonDetail: '', providers: [], providerDetail: '' };

export const PostSignupSurvey = () => {
    const [step, setStep] = useState(0);
    const [form, setForm] = useState<FormState>(INITIAL_FORM);

    const handleSubmitStepOne = (joinReason: JoinReason, joinReasonDetail: string) => {
        setForm({ ...form, joinReason, joinReasonDetail });
        setStep(1);
    };

    const handleSubmitStepTwo = (providers: PreviousProvider[], providerDetail: string) => {
        setForm({ ...form, providers, providerDetail });
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
                        initialReason={form.joinReason}
                        initialDetail={form.joinReasonDetail}
                    />
                )}
                {step === 1 && <PostSignupStep2 onSubmit={handleSubmitStepTwo} onBack={handleBackStepTwo} />}
            </Card>
        </Portal>
    );
};
