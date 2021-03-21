import React, { useRef, useState } from 'react';
import { c } from 'ttag';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { HumanVerificationMethodType } from 'proton-shared/lib/interfaces';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';

import { Alert, Href, LearnMore, Tabs } from '../../../components';
import Captcha from './Captcha';
import EmailMethodForm from './EmailMethodForm';
import useApi from '../../../hooks/useApi';
import PhoneMethodForm from './PhoneMethodForm';
import { useModals, useNotifications } from '../../../hooks';
import { VerificationModel } from './interface';
import { getRoute } from './helper';
import InvalidVerificationCodeModal from './InvalidVerificationCodeModal';
import VerifyCodeForm from './VerifyCodeForm';
import RequestNewCodeModal from './RequestNewCodeModal';

export enum Steps {
    ENTER_DESTINATION,
    VERIFY_CODE,
}

const Text = ({ children }: { children: React.ReactNode }) => {
    return <div className="mb2 mt0-5">{children}</div>;
};

interface Props {
    onSubmit: (token: string, tokenType: HumanVerificationMethodType) => void;
    token: string;
    methods: HumanVerificationMethodType[];
    defaultEmail?: string;
    defaultPhone?: string;
    defaultCountry?: string;
    step: Steps;
    onChangeStep: (step: Steps) => void;
}

const HumanVerificationForm = ({
    defaultCountry,
    defaultEmail,
    defaultPhone,
    methods,
    token,
    onSubmit,
    step,
    onChangeStep,
}: Props) => {
    const api = useApi();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();

    const verificationRef = useRef<VerificationModel | undefined>(undefined);
    const verificationModel = verificationRef.current;

    const sendCode = async (verificationModel: VerificationModel) => {
        await api(getRoute(verificationModel));
        onChangeStep(Steps.VERIFY_CODE);
        const methodTo = verificationModel.value;
        createNotification({ text: c('Success').t`Code sent to ${methodTo}` });
    };

    const handleEditDestination = () => {
        onChangeStep(Steps.ENTER_DESTINATION);
    };

    const handleResend = async () => {
        if (!verificationRef.current) {
            throw new Error('Missing state');
        }
        return sendCode(verificationRef.current);
    };

    const verifyToken = async (token: string, tokenType: 'sms' | 'email') => {
        try {
            await onSubmit(token, tokenType);
        } catch (error) {
            const { data: { Code } = { Code: 0 } } = error;

            if (Code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                createModal(<InvalidVerificationCodeModal onEdit={handleEditDestination} onResend={handleResend} />);
            }
        }
    };

    const tabs = [
        methods.includes('captcha') && {
            method: 'captcha',
            title: c('Human verification method').t`CAPTCHA`,
            content: (
                <>
                    <Text>{c('Info').t`To fight spam and abuse, please verify you are human.`}</Text>
                    <Captcha token={token} onSubmit={(token) => onSubmit(token, 'captcha')} />
                </>
            ),
        },
        methods.includes('email') && {
            method: 'email',
            title: c('Human verification method').t`Email`,
            content: (
                <>
                    <Text>
                        <span>{c('Info').t`Your email will only be used for this one-time verification.`} </span>
                        <LearnMore url="https://protonmail.com/support/knowledge-base/human-verification/" />
                    </Text>
                    <EmailMethodForm
                        api={api}
                        defaultEmail={
                            defaultEmail ||
                            (verificationModel && verificationModel.method === 'email' ? verificationModel.value : '')
                        }
                        onSubmit={async (email) => {
                            verificationRef.current = {
                                method: 'email',
                                value: email,
                            };
                            await sendCode(verificationRef.current);
                            onChangeStep(Steps.VERIFY_CODE);
                        }}
                    />
                </>
            ),
        },
        methods.includes('sms') && {
            method: 'sms',
            title: c('Human verification method').t`SMS`,
            content: (
                <>
                    <Text>
                        <span>{c('Info').t`Your phone number will only be used for this one-time verification.`} </span>
                        <LearnMore url="https://protonmail.com/support/knowledge-base/human-verification/" />
                    </Text>
                    <PhoneMethodForm
                        defaultCountry={defaultCountry}
                        onSubmit={async (phone) => {
                            verificationRef.current = {
                                method: 'sms',
                                value: phone,
                            };
                            await sendCode(verificationRef.current);
                            onChangeStep(Steps.VERIFY_CODE);
                        }}
                        defaultPhone={
                            defaultPhone ||
                            (verificationModel && verificationModel.method === 'sms' ? verificationModel.value : '')
                        }
                        api={api}
                    />
                </>
            ),
        },
        methods.includes('invite') && {
            method: 'invite',
            title: c('Human verification method').t`Manual verification`,
            content: (
                <Text>
                    {c('Info')
                        .t`If you are having trouble creating your account, please request an invitation and we will respond within one business day.`}{' '}
                    <Href url="https://protonmail.com/support-form">{c('Link').t`Request an invite`}</Href>
                </Text>
            ),
        },
    ].filter(isTruthy);

    const [index, setIndex] = useState(0);

    if (tabs.length === 0) {
        return <Alert type="error">{c('Human verification method').t`No verification method available`}</Alert>;
    }

    if (step === Steps.VERIFY_CODE && verificationModel) {
        return (
            <VerifyCodeForm
                verification={verificationModel}
                onSubmit={verifyToken}
                onNoReceive={() => {
                    createModal(
                        <RequestNewCodeModal
                            onEdit={handleEditDestination}
                            onResend={handleResend}
                            verificationModel={verificationModel}
                        />
                    );
                }}
            />
        );
    }

    return <Tabs tabs={tabs} value={index} onChange={setIndex} />;
};

export default HumanVerificationForm;
