import type { MutableRefObject } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button, Card, Href } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Api, HumanVerificationMethodType } from '@proton/shared/lib/interfaces';

import useNotifications from '../../../hooks/useNotifications';
import EmailMethodForm from './EmailMethodForm';
import PhoneMethodForm from './PhoneMethodForm';
import RequestNewCodeModal from './RequestNewCodeModal';
import Text from './Text';
import VerifyCodeForm from './VerifyCodeForm';
import { getRoute } from './helper';
import type { VerificationModel } from './interface';
import { HumanVerificationSteps } from './interface';

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
    onSubmit: (token: string, tokenType: HumanVerificationMethodType, verificationModel: VerificationModel) => void;
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

    const handleCode = async (code: string, verificationModel: VerificationModel) => {
        const tokenType = verificationModel.method;
        if (tokenType !== 'email' && tokenType !== 'sms') {
            throw new Error('Invalid verification model');
        }
        try {
            await onSubmit(code, tokenType, verificationModel);
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
                    className="mt-2"
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
                        <Href href={getKnowledgeBaseUrl('/human-verification')}>{c('Link').t`Learn more`}</Href>
                    </Text>
                    <Card bordered={false} rounded={true} className="mb-6 flex gap-2">
                        <div className="shrink-0">
                            <Icon name="info-circle" className="color-primary" />
                        </div>
                        <div className="flex-1">
                            {c('Info').t`A phone number can only be used to verify one ${BRAND_NAME} account`}
                        </div>
                    </Card>
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
                        <Href href={getKnowledgeBaseUrl('/human-verification')}>{c('Link').t`Learn more`}</Href>
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
