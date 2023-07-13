import { FormEvent, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import RegisterSecurityKeyContent from '@proton/components/containers/account/fido/RegisterSecurityKeyContent';
import { useLoading } from '@proton/hooks';
import { getSecurityKeyChallenge, registerSecurityKey } from '@proton/shared/lib/api/settings';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { RegisterCredentialsPayload, getCreatePayload } from '@proton/shared/lib/webauthn/create';
import { RegisterCredentials } from '@proton/shared/lib/webauthn/interface';
import physicalKeyRegistered from '@proton/styles/assets/img/illustrations/physical-key-registered.svg';

import {
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    useFormErrors,
} from '../../../components';
import { useApi, useErrorHandler, useEventManager } from '../../../hooks';
import AuthModal from '../../password/AuthModal';
import { maxSecurityKeyNameLength } from './constants';

enum Steps {
    Tutorial,
    Name,
    Ok,
}

const RegisteredContent = () => {
    return (
        <>
            <div className="flex flex-justify-center mt-4 mb-6 relative">
                <img src={physicalKeyRegistered} alt={c('fido2: Info').t`Security key`} />
            </div>
            <div className="text-center">{c('fido2: Info').t`Your two-factor authentication key is ready to use.`}</div>
        </>
    );
};

const AddSecurityKeyModal = ({ onClose, ...rest }: ModalProps) => {
    const [step, setStep] = useState(Steps.Tutorial);
    const [behind, setBehind] = useState(false);
    const [loading, withLoading] = useLoading();
    const normalApi = useApi();
    const errorHandler = useErrorHandler();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { call } = useEventManager();
    const { validator, onFormSubmit, reset } = useFormErrors();
    const [name, setName] = useState('');
    const [fidoError, setFidoError] = useState(false);
    const registrationPayloadRef = useRef<RegisterCredentialsPayload>();

    const getRegistrationPayload = () => {
        const run = async () => {
            let response: RegisterCredentials;
            try {
                response = await silentApi<RegisterCredentials>(getSecurityKeyChallenge());
            } catch (e) {
                errorHandler(e);
                return;
            }
            try {
                setFidoError(false);
                setBehind(true);
                registrationPayloadRef.current = await getCreatePayload(response);
                setBehind(false);
            } catch (error) {
                setFidoError(true);
                setBehind(false);
                captureMessage('Security key registration', { level: 'error', extra: { error } });
                // Purposefully logging the error for somewhat easier debugging
                console.error(error);
                return;
            }
            reset();
            setStep(Steps.Name);
        };
        void withLoading(run());
    };

    const handleRegister = () => {
        const payload = registrationPayloadRef.current;
        if (!payload) {
            throw new Error('Missing payload ref');
        }
        const run = async () => {
            try {
                await silentApi(registerSecurityKey({ ...payload, Name: name }));
                await silentApi(lockSensitiveSettings());
                await call();
            } catch (e) {
                errorHandler(e);
                return;
            }
            reset();
            setStep(Steps.Ok);
        };
        void withLoading(run());
    };

    const [authed, setAuthed] = useState(false);

    if (!authed) {
        return (
            <AuthModal
                config={unlockPasswordChanges()}
                {...rest}
                onCancel={onClose}
                onSuccess={async () => {
                    setAuthed(true);
                    reset();
                }}
                prioritised2FAItem="totp"
            />
        );
    }

    const handleClose = () => {
        void silentApi(lockSensitiveSettings());
        onClose?.();
    };

    return (
        <Modal
            as={Form}
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
                if (step === Steps.Tutorial) {
                    getRegistrationPayload();
                    return;
                }
                if (!onFormSubmit(event.currentTarget)) {
                    return;
                }
                if (step === Steps.Name) {
                    handleRegister();
                }
            }}
            onClose={handleClose}
            size="small"
            behind={behind}
            {...rest}
        >
            <ModalHeader
                title={(() => {
                    if (step === Steps.Ok) {
                        return c('fido2: Title').t`Security key registered`;
                    }
                    if (step === Steps.Name) {
                        return c('fido2: Title').t`Name your security key`;
                    }
                    return c('fido2: Title').t`Register your security key`;
                })()}
            />
            <ModalContent>
                {step === Steps.Tutorial && <RegisterSecurityKeyContent error={fidoError} />}
                {step === Steps.Name && (
                    <>
                        <InputFieldTwo
                            autoFocus
                            maxLength={maxSecurityKeyNameLength}
                            label={c('fido2: Label').t`Key name`}
                            error={validator([requiredValidator(name)])}
                            value={name}
                            onValue={setName}
                        />
                        <div>{c('fido2: Info').t`Add a name to identify your security key with.`}</div>
                    </>
                )}
                {step === Steps.Ok && <RegisteredContent />}
            </ModalContent>
            {step === Steps.Ok ? (
                <ModalFooter>
                    <div />
                    <Button onClick={handleClose} color="norm">
                        {c('Action').t`Done`}
                    </Button>
                </ModalFooter>
            ) : (
                <ModalFooter>
                    <Button onClick={handleClose} disabled={loading}>
                        {c('Action').t`Cancel`}
                    </Button>
                    <Button loading={loading} type="submit" color="norm">
                        {c('Action').t`Continue`}
                    </Button>
                </ModalFooter>
            )}
        </Modal>
    );
};

export default AddSecurityKeyModal;
