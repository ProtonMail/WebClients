import type { FormEvent } from 'react';
import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useFido2Action } from '@proton/account/fido/useFido2Action';
import { userSettingsThunk } from '@proton/account/userSettings';
import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities/interface';
import { getSecurityKeyChallenge, registerSecurityKey } from '@proton/shared/lib/api/settings';
import { lockSensitiveSettings, unlockPasswordChanges } from '@proton/shared/lib/api/user';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { RegisterCredentialsPayload } from '@proton/shared/lib/webauthn/create';
import { getCreatePayload } from '@proton/shared/lib/webauthn/create';
import type { RegisterCredentials } from '@proton/shared/lib/webauthn/interface';
import physicalKeyRegistered from '@proton/styles/assets/img/illustrations/physical-key-registered.svg';

import Form from '../../../components/form/Form';
import Checkbox from '../../../components/input/Checkbox';
import Info from '../../../components/link/Info';
import type { ModalProps } from '../../../components/modalTwo/Modal';
import Modal from '../../../components/modalTwo/Modal';
import ModalContent from '../../../components/modalTwo/ModalContent';
import ModalFooter from '../../../components/modalTwo/ModalFooter';
import ModalHeader from '../../../components/modalTwo/ModalHeader';
import InputFieldTwo from '../../../components/v2/field/InputField';
import useFormErrors from '../../../components/v2/useFormErrors';
import useErrorHandler from '../../../hooks/useErrorHandler';
import AuthModal from '../../password/AuthModal';
import RegisterSecurityKeyContent from './RegisterSecurityKeyContent';
import { maxSecurityKeyNameLength } from './constants';

enum Steps {
    Tutorial,
    Name,
    Ok,
}

const RegisteredContent = () => {
    return (
        <>
            <div className="flex justify-center mt-4 mb-6 relative">
                <img src={physicalKeyRegistered} alt={c('fido2: Info').t`Security key`} />
            </div>
            <div className="text-center">{c('fido2: Info').t`Your two-factor authentication key is ready to use.`}</div>
        </>
    );
};

const AddSecurityKeyModal = ({ onClose, ...rest }: ModalProps) => {
    const [step, setStep] = useState(Steps.Tutorial);
    const [loading, withLoading] = useLoading();
    const normalApi = useApi();
    const errorHandler = useErrorHandler();
    const dispatch = useDispatch();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { validator, onFormSubmit, reset } = useFormErrors();
    const [name, setName] = useState('');
    const { fidoError, awaitingTouch, runFido2Action, abort } = useFido2Action();
    const registrationPayloadRef = useRef<RegisterCredentialsPayload>();
    const [allowPlatformKeys, setAllowPlatformKeys] = useState(false);

    const getRegistrationPayload = () => {
        const run = async () => {
            let response: RegisterCredentials;
            try {
                response = await silentApi<RegisterCredentials>(getSecurityKeyChallenge(!allowPlatformKeys));
            } catch (e) {
                errorHandler(e);
                return;
            }
            try {
                registrationPayloadRef.current = await runFido2Action(
                    (signal) => getCreatePayload(response, signal),
                    'registration'
                );
            } catch {
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
                await dispatch(userSettingsThunk({ cache: CacheType.None }));
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
                scope="password"
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
        if (abort()) {
            return;
        }
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
                {step === Steps.Tutorial && (
                    <RegisterSecurityKeyContent
                        awaitingTouch={awaitingTouch}
                        error={fidoError}
                        checkbox={
                            <>
                                <Checkbox
                                    id="allow-platform-keys"
                                    checked={allowPlatformKeys}
                                    onChange={(e) => setAllowPlatformKeys(e.target.checked)}
                                >
                                    {c('fido2: Info').t`Allow platform keys`}
                                </Checkbox>
                                <Info
                                    className="ml-1"
                                    title={c('fido2: Info')
                                        .t`Allows you to register built-in security keys (like Windows Hello, Face ID, Touch ID, or internal TPMs)`}
                                />
                            </>
                        }
                    />
                )}
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
                    <Button onClick={handleClose}>{c('Action').t`Cancel`}</Button>
                    <Button loading={loading} type="submit" color="norm">
                        {c('Action').t`Continue`}
                    </Button>
                </ModalFooter>
            )}
        </Modal>
    );
};

export default AddSecurityKeyModal;
