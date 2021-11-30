import { MutableRefObject, useEffect, useState } from 'react';
import { c } from 'ttag';
import { Api, HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { Button, LearnMore } from '../../../components';
import useLoading from '../../../hooks/useLoading';
import useNotifications from '../../../hooks/useNotifications';

import Text from './Text';
import EmailMethodForm from './EmailMethodForm';
import { VerificationModel, HumanVerificationSteps } from './interface';
import PhoneMethodForm from './PhoneMethodForm';
import RequestNewCodeModal from './RequestNewCodeModal';
import VerifyCodeForm from './VerifyCodeForm';
import { getRoute } from './helper';

interface Props {
    api: Api;
    method: 'sms' | 'email';
    onLoaded: () => void;
    step: HumanVerificationSteps;
    onChangeStep: (step: HumanVerificationSteps) => void;
    defaultCountry?: string;
    defaultPhone?: string;
    defaultEmail?: string;
    isEmbedded?: boolean;
    onSubmit: (token: string, tokenType: HumanVerificationMethodType) => void;
    verificationModelCacheRef: MutableRefObject<VerificationModel | undefined>;
}

const CodeMethod = ({
    api,
    method,
    step,
    onChangeStep,
    onSubmit,
    isEmbedded,
    onLoaded,
    defaultEmail,
    defaultPhone,
    defaultCountry,
    verificationModelCacheRef,
}: Props) => {
    const [newCodeModal, setNewCodeModal] = useState(false);
    const [loadingResend, withLoadingResend] = useLoading();
    const { createNotification } = useNotifications();

    useEffect(() => {
        onLoaded();
    }, []);

    const sendCode = async (verificationModel: VerificationModel) => {
        await api(getRoute(verificationModel));
        onChangeStep(HumanVerificationSteps.VERIFY_CODE);
        const methodTo = verificationModel.value;
        createNotification({ text: c('Success').t`Code sent to ${methodTo}` });
    };

    const handleEditDestination = () => {
        onChangeStep(HumanVerificationSteps.ENTER_DESTINATION);
    };

    const handleCode = async (code: string, tokenType: 'sms' | 'email' | 'ownership-email' | 'ownership-sms') => {
        if (tokenType !== 'email' && tokenType !== 'sms') {
            throw new Error('Invalid verification model');
        }
        try {
            await onSubmit(code, tokenType);
        } catch (error: any) {
            const { code } = getApiError(error);

            if (code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                onChangeStep(HumanVerificationSteps.INVALID_CODE);
            }
        }
    };

    const verificationModel = verificationModelCacheRef.current;

    if (step === HumanVerificationSteps.INVALID_CODE && verificationModel) {
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
                        await withLoadingResend(sendCode(verificationModel));
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

    if (step === HumanVerificationSteps.VERIFY_CODE && verificationModel) {
        return (
            <>
                <RequestNewCodeModal
                    open={newCodeModal}
                    onEdit={handleEditDestination}
                    onClose={() => setNewCodeModal(false)}
                    onResend={() => sendCode(verificationModel)}
                    verificationModel={verificationModel}
                />
                <VerifyCodeForm
                    verification={verificationModel}
                    onSubmit={handleCode}
                    onNoReceive={() => {
                        setNewCodeModal(true);
                    }}
                />
            </>
        );
    }

    return (
        <>
            {method === 'sms' && (
                <>
                    <Text>
                        <span>{c('Info').t`Your phone number will only be used for this one-time verification.`} </span>
                        <LearnMore url="https://protonmail.com/support/knowledge-base/human-verification/" />
                    </Text>
                    <PhoneMethodForm
                        isEmbedded={isEmbedded}
                        defaultCountry={defaultCountry}
                        onSubmit={async (phone) => {
                            const verificationModel = {
                                method: 'sms',
                                value: phone,
                            } as const;
                            verificationModelCacheRef.current = verificationModel;
                            await sendCode(verificationModel);
                        }}
                        defaultPhone={
                            defaultPhone ||
                            (verificationModel && verificationModel.method === 'sms' ? verificationModel.value : '')
                        }
                        api={api}
                    />
                </>
            )}
            {method === 'email' && (
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
                            const verificationModel = {
                                method: 'email',
                                value: email,
                            } as const;
                            verificationModelCacheRef.current = verificationModel;
                            await sendCode(verificationModel);
                        }}
                    />
                </>
            )}
        </>
    );
};

export default CodeMethod;
