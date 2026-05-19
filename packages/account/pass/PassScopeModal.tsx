import { useRef, useState } from 'react';

import { getSrp } from '@protontech/crypto/srp';
import { c } from 'ttag';

import { userThunk } from '@proton/account/user';
import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useEventManager from '@proton/components/hooks/useEventManager';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities/interface';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { AuthVersion } from '@proton/shared/lib/authentication/interface';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

const PASS_INCORRECT_PASSWORD_CODE = 2011;
const PASS_LOGOUT_CODE = 2026;

interface PassSrpData {
    Modulus: string;
    ServerEphemeral: string;
    SrpSessionID: string;
    SrpSalt: string;
    Version: AuthVersion;
}

export interface PassScopeModalProps extends ModalProps<'form'> {
    onSuccess?: () => Promise<void> | void;
    onCancel: (() => void) | undefined;
}

const PassScopeModal = ({ onSuccess, onClose, onCancel, ...rest }: PassScopeModalProps) => {
    const api = useApi();
    const [submitting, withSubmitting] = useLoading();
    const errorHandler = useErrorHandler();
    const dispatch = useDispatch();
    const eventManager = useEventManager();

    const { validator, onFormSubmit } = useFormErrors();
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const passwordInput = useRef<HTMLInputElement>(null);

    const cancelClose = () => {
        onCancel?.();
        onClose?.();
    };

    const handleSubmit = async ({ password }: { password: string }) => {
        try {
            const infoResult = await api<{ SRPData: PassSrpData }>({
                url: 'pass/v1/user/srp/info',
                method: 'get',
                silence: true,
            });
            const { Version, SrpSalt: Salt, Modulus, ServerEphemeral, SrpSessionID } = infoResult.SRPData;
            const authInfo = { ServerEphemeral, Modulus, Version, Salt };
            const credentials = {
                password,
            };
            const srp = await getSrp(authInfo, credentials, Version);
            const { ServerProof } = await api<{ ServerProof: string }>({
                url: 'pass/v1/user/srp/auth',
                method: 'post',
                silence: true,
                data: {
                    ClientEphemeral: srp.clientEphemeral,
                    ClientProof: srp.clientProof,
                    SrpSessionID: SrpSessionID,
                },
            });
            if (ServerProof !== srp.expectedServerProof) {
                throw new Error('Unexpected server proof');
            }
            // We want to just keep the modal open until the consumer's promise is finished. Not interested in errors.
            await onSuccess?.()?.catch(noop);
            onClose?.();
        } catch (error: any) {
            const { code, message } = getApiError(error);

            // Try again.
            if (code === PASS_INCORRECT_PASSWORD_CODE) {
                passwordInput.current?.focus();
                setPasswordError(message);
                return;
            }

            // Special handling when having tried too many times.
            if (code === PASS_LOGOUT_CODE) {
                // Stop the event manager to prevent API calls.
                eventManager.stop();
                // Show the logout error notification from the API.
                errorHandler(error);
                // Wait a little bit to show the error to the user.
                await wait(3500);
                // Hack: trigger an API call to trigger the logout handler.
                await dispatch(userThunk({ cache: CacheType.None })).catch(noop);
                return;
            }

            // Otherwise just cancel and close.
            errorHandler(error);
            cancelClose();
        }
    };

    return (
        <Modal
            size="small"
            as={Form}
            onSubmit={(event) => {
                if (!onFormSubmit(event.currentTarget) || submitting) {
                    return;
                }
                withSubmitting(handleSubmit({ password })).catch(noop);
            }}
            {...rest}
            onClose={cancelClose}
            data-protonpass-autosave-ignore="true"
        >
            <ModalHeader title={c('emergency_access').t`Unlock ${PASS_APP_NAME}`} />
            <ModalContent>
                <InputFieldTwo
                    ref={passwordInput}
                    autoFocus
                    autoComplete="current-password"
                    id="extra-password"
                    name="extra-password"
                    as={PasswordInputTwo}
                    value={password}
                    disableChange={submitting}
                    onValue={(value) => {
                        setPassword(value);
                        setPasswordError('');
                    }}
                    error={validator([passwordError, requiredValidator(password)])}
                    label={c('emergency_access').t`Enter your extra password`}
                    data-protonpass-ignore={true}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={cancelClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={submitting}>
                    {c('Action').t`Authenticate`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default PassScopeModal;
