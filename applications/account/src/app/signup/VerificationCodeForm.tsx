import React, { useState } from 'react';
import { c } from 'ttag';
import { TOKEN_TYPES } from 'proton-shared/lib/constants';
import { queryCheckVerificationCode, queryVerificationCode } from 'proton-shared/lib/api/user';
import InvalidVerificationCodeModal from 'react-components/containers/api/humanVerification/InvalidVerificationCodeModal';
import { noop } from 'proton-shared/lib/helpers/function';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';

import { useModals, RequestNewCodeModal, VerifyCodeForm, useNotifications } from 'react-components';
import { SignupModel } from './interfaces';
import { HumanApi } from './helpers/humanApi';

interface Props {
    model: SignupModel;
    onSubmit: () => void;
    humanApi: HumanApi;
    onBack: () => void;
    clientType: 1 | 2;
}

const VerificationCodeForm = ({ model, humanApi, onBack, onSubmit, clientType }: Props) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [key, setKey] = useState(0);

    const handleResend = async () => {
        await humanApi.api(queryVerificationCode('email', { Address: model.email }));
        const methodTo = model.email;
        createNotification({ text: c('Success').t`Code sent to ${methodTo}` });
        // To reset the internal state in verifyCodeForm
        setKey((oldKey) => oldKey + 1);
    };

    const tokenType = TOKEN_TYPES.EMAIL;
    const verificationModel = {
        method: 'email',
        value: model.email,
    } as const;

    const handleModalResend = () => {
        createModal(
            <RequestNewCodeModal
                verificationModel={verificationModel}
                onEdit={() => {
                    return onBack();
                }}
                onResend={() => {
                    return handleResend().catch(noop);
                }}
                email={model.email}
            />
        );
    };

    const handleSubmit = async (token: string) => {
        try {
            await humanApi.api(queryCheckVerificationCode(token, tokenType, clientType));
            humanApi.setToken(token, tokenType);
            onSubmit();
        } catch (error) {
            const { data: { Code } = { Code: 0 } } = error;

            if (Code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                createModal(
                    <InvalidVerificationCodeModal
                        edit={c('Action').t`Change email`}
                        request={c('Action').t`Request new code`}
                        onEdit={() => {
                            return onBack();
                        }}
                        onResend={() => {
                            return handleResend().catch(noop);
                        }}
                    />
                );
            }
        }
    };

    return (
        <form
            name="humanForm"
            onSubmit={(e) => {
                e.preventDefault();
            }}
            method="post"
        >
            <div className="mb1">{c('Info').t`For security reasons, please verify that you are not a robot.`}</div>
            <VerifyCodeForm
                key={key}
                verification={verificationModel}
                onSubmit={handleSubmit}
                onNoReceive={handleModalResend}
            />
        </form>
    );
};

export default VerificationCodeForm;
