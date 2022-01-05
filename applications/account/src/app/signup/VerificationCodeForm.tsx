import { useState } from 'react';
import { c } from 'ttag';
import { TOKEN_TYPES } from '@proton/shared/lib/constants';
import { queryCheckVerificationCode, queryVerificationCode } from '@proton/shared/lib/api/user';
import InvalidVerificationCodeModal from '@proton/components/containers/api/humanVerification/InvalidVerificationCodeModal';
import { noop } from '@proton/shared/lib/helpers/function';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { RequestNewCodeModal, VerifyCodeForm, useNotifications } from '@proton/components';
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
    const { createNotification } = useNotifications();
    const [key, setKey] = useState(0);
    const [newCodeModal, setNewCodeModal] = useState(false);
    const [invalidVerificationModal, setInvalidVerificationModal] = useState(false);

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

    const handleSubmit = async (token: string) => {
        try {
            await humanApi.api(queryCheckVerificationCode(token, tokenType, clientType));
            humanApi.setToken(token, tokenType);
            onSubmit();
        } catch (error: any) {
            const { data: { Code } = { Code: 0 } } = error;

            if (Code === API_CUSTOM_ERROR_CODES.TOKEN_INVALID) {
                setInvalidVerificationModal(true);
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
            <RequestNewCodeModal
                open={newCodeModal}
                verificationModel={verificationModel}
                onClose={() => setNewCodeModal(false)}
                onEdit={onBack}
                onResend={() => handleResend().catch(noop)}
            />
            <InvalidVerificationCodeModal
                open={invalidVerificationModal}
                edit={c('Action').t`Change email`}
                request={c('Action').t`Request new code`}
                onClose={() => setInvalidVerificationModal(false)}
                onEdit={onBack}
                onResend={() => handleResend().catch(noop)}
            />
            <div className="mb1">{c('Info').t`For security reasons, please verify that you are not a robot.`}</div>
            <VerifyCodeForm
                key={key}
                verification={verificationModel}
                onSubmit={handleSubmit}
                onNoReceive={() => setNewCodeModal(true)}
            />
        </form>
    );
};

export default VerificationCodeForm;
