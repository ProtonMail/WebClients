import { ReactNode, useRef, useState } from 'react';
import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { Alert, Button, Href, LearnMore, Tabs } from '../../../components';
import useApi from '../../../hooks/useApi';
import useNotifications from '../../../hooks/useNotifications';
import useLoading from '../../../hooks/useLoading';
import { VerificationModel } from './interface';
import { getRoute } from './helper';
import Captcha from './Captcha';
import EmailMethodForm from './EmailMethodForm';
import PhoneMethodForm from './PhoneMethodForm';
import VerifyCodeForm from './VerifyCodeForm';

import './HumanVerificationModal.scss';

export enum HumanVerificationSteps {
    ENTER_DESTINATION,
    VERIFY_CODE,
    REQUEST_NEW_CODE,
    INVALID_CODE,
}

const Text = ({ children }: { children: ReactNode }) => {
    return <div className="mb2 mt0-5">{children}</div>;
};

interface Props {
    onSubmit: (token: string, tokenType: HumanVerificationMethodType) => void;
    token: string;
    methods: HumanVerificationMethodType[];
    defaultEmail?: string;
    defaultPhone?: string;
    defaultCountry?: string;
    step: HumanVerificationSteps;
    isEmbedded?: boolean;
    onChangeStep: (step: HumanVerificationSteps) => void;
}

const HumanVerificationForm = ({
    defaultCountry,
    defaultEmail,
    defaultPhone,
    methods,
    token,
    onSubmit,
    step,
    isEmbedded,
    onChangeStep,
}: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [loadingResend, withLoadingResend] = useLoading();

    const verificationRef = useRef<VerificationModel | undefined>(undefined);
    const verificationModel = verificationRef.current;

    const sendCode = async (verificationModel: VerificationModel) => {
        await api(getRoute(verificationModel));
        onChangeStep(HumanVerificationSteps.VERIFY_CODE);
        const methodTo = verificationModel.value;
        createNotification({ text: c('Success').t`Code sent to ${methodTo}` });
    };

    const handleEditDestination = () => {
        onChangeStep(HumanVerificationSteps.ENTER_DESTINATION);
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
        } catch (error: any) {
            const { data: { Code } = { Code: 0 } } = error;

            if (Code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                onChangeStep(HumanVerificationSteps.INVALID_CODE);
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
                            onChangeStep(HumanVerificationSteps.VERIFY_CODE);
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
                        isEmbedded={isEmbedded}
                        defaultCountry={defaultCountry}
                        onSubmit={async (phone) => {
                            verificationRef.current = {
                                method: 'sms',
                                value: phone,
                            };
                            await sendCode(verificationRef.current);
                            onChangeStep(HumanVerificationSteps.VERIFY_CODE);
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
            title: c('Human verification method').t`Manual`,
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
        return (
            <Alert className="mb1" type="error">{c('Human verification method')
                .t`No verification method available`}</Alert>
        );
    }

    if (step === HumanVerificationSteps.VERIFY_CODE && verificationModel) {
        return (
            <VerifyCodeForm
                verification={verificationModel}
                onSubmit={verifyToken}
                onNoReceive={() => onChangeStep(HumanVerificationSteps.REQUEST_NEW_CODE)}
            />
        );
    }

    if (step === HumanVerificationSteps.INVALID_CODE) {
        return (
            <>
                <h1 className="h6 text-bold">{c('Title').t`Invalid verification code`}</h1>
                <p>
                    {c('Info')
                        .t`Would you like to receive a new verification code or use an alternative verification method?`}
                </p>
                <Button
                    fullWidth
                    size="large"
                    color="norm"
                    type="button"
                    loading={loadingResend}
                    onClick={async () => {
                        await withLoadingResend(handleResend());
                        onChangeStep(HumanVerificationSteps.VERIFY_CODE);
                    }}
                >
                    {c('Action').t`Request new code`}
                </Button>
                <Button
                    fullWidth
                    className="mt0-5"
                    size="large"
                    color="weak"
                    type="button"
                    onClick={handleEditDestination}
                >
                    {c('Action').t`Try another method`}
                </Button>
            </>
        );
    }

    if (step === HumanVerificationSteps.REQUEST_NEW_CODE && verificationModel) {
        const strong = <strong key="email">{verificationModel.value}</strong>;

        return (
            <>
                <p className="mt0">
                    {verificationModel.method === 'email'
                        ? c('Info')
                              .jt`Click "Request new code" to have a new verification code sent to ${strong}. If this email address is incorrect, click "Edit" to correct it.`
                        : c('Info')
                              .jt`Click "Request new code" to have a new verification code sent to ${strong}. If this phone number is incorrect, click "Edit" to correct it.`}
                </p>
                <Button
                    size="large"
                    color="norm"
                    type="button"
                    fullWidth
                    loading={loadingResend}
                    onClick={async () => {
                        await withLoadingResend(handleResend());
                        onChangeStep(HumanVerificationSteps.VERIFY_CODE);
                    }}
                >
                    {c('Action').t`Request new code`}
                </Button>
                <Button
                    className="mt0-5"
                    size="large"
                    color="weak"
                    type="button"
                    onClick={handleEditDestination}
                    disabled={loadingResend}
                    fullWidth
                >
                    {verificationModel.method === 'email'
                        ? c('Action').t`Edit email address`
                        : c('Action').t`Edit phone number`}
                </Button>
                <Button
                    className="mt0-5"
                    size="large"
                    color="weak"
                    type="button"
                    onClick={() => onChangeStep(HumanVerificationSteps.VERIFY_CODE)}
                    disabled={loadingResend}
                    fullWidth
                >
                    {c('Action').t`Cancel`}
                </Button>
            </>
        );
    }

    return <Tabs tabs={tabs} value={index} onChange={setIndex} />;
};

export default HumanVerificationForm;
