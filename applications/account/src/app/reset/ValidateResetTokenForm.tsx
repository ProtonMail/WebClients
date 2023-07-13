import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { InputFieldTwo, RequestNewCodeModal, useApi, useErrorHandler, useFormErrors } from '@proton/components';
import { RecoveryMethod, ValidateResetTokenResponse } from '@proton/components/containers/resetPassword/interface';
import { useLoading } from '@proton/hooks';
import { validateResetToken } from '@proton/shared/lib/api/reset';
import { getPrimaryAddress } from '@proton/shared/lib/helpers/address';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import Text from '../public/Text';
import ValidateResetTokenConfirmModal from './ValidateResetTokenConfirmModal';

interface Props {
    onSubmit: ({ resetResponse, token }: { resetResponse: ValidateResetTokenResponse; token: string }) => Promise<void>;
    onBack: () => void;
    onRequest: () => Promise<void>;
    method: RecoveryMethod;
    recoveryMethods: RecoveryMethod[];
    value: string;
    username: string;
}

const ValidateResetTokenForm = ({ onSubmit, onBack, onRequest, method, recoveryMethods, value, username }: Props) => {
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const handleError = useErrorHandler();

    const [loading, withLoading] = useLoading();
    const [confirmModal, setConfirmModal] = useState(false);
    const [newCodeModal, setNewCodeModal] = useState(false);
    const [token, setToken] = useState('');
    const [resetResponse, setResetResponse] = useState<ValidateResetTokenResponse>();

    const address = useMemo(() => {
        const addresses = resetResponse?.Addresses;

        if (!addresses || addresses.length === 0) {
            return undefined;
        }

        return getPrimaryAddress(addresses)?.Email || addresses[0].Email;
    }, [resetResponse?.Addresses, getPrimaryAddress]);

    const { validator, onFormSubmit } = useFormErrors();

    // To not break translations
    const email = value;
    const phone = value;
    const subTitle =
        method === 'email'
            ? c('Info')
                  .t`Enter the code that was sent to ${email}. If you can't find the message in your inbox, please check your spam folder.`
            : c('Info').t`Enter the code sent to your phone number ${phone}.`;

    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault();
                if (loading || !onFormSubmit()) {
                    return;
                }

                const submit = async () => {
                    try {
                        const resetResponse = await silentApi<ValidateResetTokenResponse>(
                            validateResetToken(username, token)
                        );
                        setResetResponse(resetResponse);
                        setConfirmModal(true);
                    } catch (e: any) {
                        handleError(e);
                    }
                };

                void withLoading(submit()).catch(noop);
            }}
        >
            <ValidateResetTokenConfirmModal
                onClose={() => setConfirmModal(false)}
                onConfirm={() => {
                    if (!resetResponse) {
                        return;
                    }
                    withLoading(onSubmit({ resetResponse, token: token.trim() })).catch(noop);
                }}
                open={confirmModal}
                recoveryMethods={recoveryMethods}
                address={address}
            />
            {(method === 'sms' || method === 'email') && (
                <RequestNewCodeModal
                    verificationModel={{
                        method,
                        value,
                    }}
                    onClose={() => setNewCodeModal(false)}
                    open={newCodeModal}
                    onEdit={onBack}
                    onResend={onRequest}
                />
            )}
            <Text>{subTitle}</Text>
            <InputFieldTwo
                id="reset-token"
                bigger
                label={c('Label').t`Code`}
                error={validator([requiredValidator(token)])}
                disableChange={loading}
                value={token}
                onValue={setToken}
                autoFocus
            />
            <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
                {c('Action').t`Reset password`}
            </Button>
            {(method === 'sms' || method === 'email') && (
                <Button
                    size="large"
                    color="norm"
                    shape="ghost"
                    type="button"
                    fullWidth
                    disabled={loading}
                    onClick={() => setNewCodeModal(true)}
                    className="mt-2"
                >
                    {c('Action').t`Didn't receive a code?`}
                </Button>
            )}
        </form>
    );
};

export default ValidateResetTokenForm;
