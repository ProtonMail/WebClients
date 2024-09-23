import type { MutableRefObject, ReactNode } from 'react';
import { Fragment, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import Loader from '@proton/components/components/loader/Loader';
import { isVerifyAddressOwnership } from '@proton/components/containers/api/humanVerification/helper';
import { useLoading } from '@proton/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import {
    getVerificationDataRoute,
    sendVerificationCode,
    verifyVerificationCode,
} from '@proton/shared/lib/api/verification';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api, HumanVerificationMethodType } from '@proton/shared/lib/interfaces';

import { useNotifications } from '../../../hooks';
import RequestNewCodeModal from './RequestNewCodeModal';
import Text from './Text';
import VerifyCodeForm from './VerifyCodeForm';
import accountVerified from './account-verified.svg';
import type {
    OwnershipCache,
    OwnershipVerificationModel,
    VerificationDataResult,
    VerificationModel,
    VerificationTokenResult,
} from './interface';
import { HumanVerificationSteps } from './interface';

const formatMessage = (text: string, embolden: string) => {
    if (!embolden) {
        return text;
    }
    return text.split(embolden).reduce<ReactNode[]>((acc, cur, i, arr) => {
        acc.push(<Fragment key={`${cur}${i}`}>{cur}</Fragment>);
        if (i !== arr.length - 1) {
            acc.push(<strong key={`${embolden}${i}`}>{embolden}</strong>);
        }
        return acc;
    }, []);
};

const getOwnershipData = async ({
    token,
    method,
    cacheRef,
    api,
}: {
    token: string;
    method: 'ownership-email' | 'ownership-sms';
    cacheRef: MutableRefObject<OwnershipCache>;
    api: Api;
}) => {
    const cache = cacheRef.current[method];
    if (cache.promise === undefined) {
        const promise = Promise.all([
            api<VerificationDataResult>({ ...getVerificationDataRoute(token, method), silence: true }),
            // Automatically send the code the first time.
            api<null>(sendVerificationCode(token, method)),
        ]);
        cache.promise = promise;
    }
    const [verificationData] = await cache.promise;
    const result: OwnershipVerificationModel = {
        method,
        value: verificationData.ChallengeDestination,
        type: verificationData.ChallengeType,
        description: verificationData.ChallengeText,
    };
    cache.result = result;
    return result;
};

interface Props {
    method: 'ownership-sms' | 'ownership-email';
    onSubmit: (token: string, tokenType: HumanVerificationMethodType) => void;
    onClose: () => void;
    onError: (e: unknown) => void;
    token: string;
    api: Api;
    step: HumanVerificationSteps;
    onChangeStep: (step: HumanVerificationSteps) => void;
    ownershipCacheRef: MutableRefObject<OwnershipCache>;
    onLoaded: () => void;
    verifyApp?: boolean;
}

const OwnershipMethod = ({
    api,
    token,
    method,
    step,
    onLoaded,
    onChangeStep,
    ownershipCacheRef,
    onSubmit,
    onClose,
    onError,
    verifyApp,
}: Props) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const [newCodeModal, setNewCodeModal] = useState(false);
    const [, forceRender] = useState<any>();

    const verificationModel = ownershipCacheRef.current[method]?.result;

    useEffect(() => {
        let isActive = true;
        getOwnershipData({ method, token, api, cacheRef: ownershipCacheRef })
            .then(() => {
                if (!isActive) {
                    return;
                }
                flushSync(() => {
                    // Force render to get the new cache
                    forceRender({});
                    // Trigger the loaded callback after render
                    onLoaded();
                });
            })
            .catch(onError);
        return () => {
            isActive = false;
        };
    }, [method]);

    const handleCode = async (code: string, verificationModel: VerificationModel) => {
        if (verificationModel.method !== 'ownership-email' && verificationModel.method !== 'ownership-sms') {
            throw new Error('Invalid verification model');
        }
        try {
            const { Token } = await api<VerificationTokenResult>(verifyVerificationCode(token, method, code));
            await onSubmit(Token, verificationModel.method);
            if (verifyApp) {
                onChangeStep(HumanVerificationSteps.SUCCESSFUL_CODE);
            }
        } catch (error: any) {
            const { code } = getApiError(error);

            if (code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                onChangeStep(HumanVerificationSteps.INVALID_CODE);
            }
        }
    };

    const handleSendCode = async (verificationModel: OwnershipVerificationModel) => {
        await api(sendVerificationCode(token, method));
        const methodTo = verificationModel.value;
        createNotification({ text: c('Success').t`Code sent to ${methodTo}` });
        onChangeStep(HumanVerificationSteps.ENTER_DESTINATION);
    };

    if (!verificationModel) {
        return <Loader />;
    }

    if (step === HumanVerificationSteps.INVALID_CODE) {
        return (
            <>
                <h1 className="h6 text-bold">{c('Title').t`Invalid verification code`}</h1>
                <p>{c('Info').t`Would you like to receive a new verification code?`}</p>
                <Button
                    fullWidth
                    size="large"
                    color="norm"
                    type="button"
                    loading={loading}
                    onClick={async () => {
                        await withLoading(handleSendCode(verificationModel));
                    }}
                >
                    {c('Action').t`Request new code`}
                </Button>
            </>
        );
    }

    if (step === HumanVerificationSteps.SUCCESSFUL_CODE) {
        return (
            <>
                <div className="text-center">
                    <img src={accountVerified} alt="verification successful" />
                    <p>{c('Info').t`You can now return to the application to continue`}</p>
                </div>
            </>
        );
    }

    return (
        <>
            <RequestNewCodeModal
                open={newCodeModal}
                onEdit={onClose}
                onClose={() => setNewCodeModal(false)}
                onResend={() => handleSendCode(verificationModel)}
                verificationModel={verificationModel}
            />
            <VerifyCodeForm
                description={
                    <Text className="text-pre-wrap">
                        {formatMessage(verificationModel.description, verificationModel.value)}
                    </Text>
                }
                footer={
                    isVerifyAddressOwnership(verificationModel) && !verifyApp ? (
                        <div className="mt-2">
                            <hr />
                            <div className="text-center mt-5 mb-5">
                                <SettingsLink key="link" path="/account-password?action=edit-email">
                                    {c('Info').t`Edit email address`}
                                </SettingsLink>
                            </div>
                        </div>
                    ) : null
                }
                verification={verificationModel}
                onSubmit={handleCode}
                onNoReceive={() => {
                    setNewCodeModal(true);
                }}
            />
        </>
    );
};

export default OwnershipMethod;
