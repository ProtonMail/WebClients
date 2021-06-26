import React, { ChangeEvent, useEffect, useState } from 'react';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import {
    KeyReactivationData,
    KeyReactivationRecord,
    OnKeyReactivationCallback,
    decryptPrivateKeyWithSalt,
    getHasMigratedAddressKey,
} from '@proton/shared/lib/keys';
import { KeySalt } from '@proton/shared/lib/interfaces';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import { Alert, Field, FormModal, InlineLinkButton, Label, Loader, PasswordInput } from '../../../components';
import { useApi, useModals, useNotifications } from '../../../hooks';
import GenericError from '../../error/GenericError';

import ReactivateKeysList from './ReactivateKeysList';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';
import { getInitialStates, getUploadedPrivateKeys, updateKey } from './state';
import {
    KeyReactivationRequest,
    KeyReactivationRequestState,
    KeyReactivationRequestStateData,
    Status,
} from './interface';

enum STEPS {
    LOADING,
    INFO,
    OR_UPLOAD,
    OR_PASSWORD,
    PROCESS,
    DONE,
    FAILURE,
}

interface Props {
    onClose?: () => void;
    keyReactivationRequests: KeyReactivationRequest[];
    onProcess: (
        keysToReactivate: KeyReactivationRecord[],
        oldPassword: string,
        onReactivation: OnKeyReactivationCallback
    ) => Promise<void>;
}

interface KeyReactivationError {
    id: string;
    error: Error;
}

const getKey = async (
    { id, Key }: KeyReactivationRequestStateData,
    oldPassword: string,
    keySalts: KeySalt[]
): Promise<KeyReactivationData | KeyReactivationError> => {
    if (getHasMigratedAddressKey(Key)) {
        return {
            id,
            Key,
            // Force the type here. Migrated address keys are not reactivated by a password.
        } as KeyReactivationData;
    }
    try {
        const { KeySalt } = keySalts.find(({ ID: keySaltID }) => Key.ID === keySaltID) || {};

        const privateKey = await decryptPrivateKeyWithSalt({
            PrivateKey: Key.PrivateKey,
            keySalt: KeySalt,
            password: oldPassword,
        });

        return {
            id,
            Key,
            privateKey,
        };
    } catch (e) {
        return {
            id,
            Key,
            error: new Error(c('Error').t`Incorrect password`),
        };
    }
};

const getReactivatedKeys = async (
    keysToReactivate: KeyReactivationRequestStateData[],
    oldPassword: string,
    keySalts: KeySalt[]
) => {
    const reactivatedKeys = await Promise.all(
        keysToReactivate.map(async (keyData) => {
            return getKey(keyData, oldPassword, keySalts);
        })
    );
    const errors = reactivatedKeys.filter((reactivatedKey): reactivatedKey is KeyReactivationError => {
        return 'error' in reactivatedKey;
    });
    const process = reactivatedKeys.filter((reactivatedKey): reactivatedKey is KeyReactivationData => {
        return !('error' in reactivatedKey);
    });
    return { process, errors };
};

const ReactivateKeysModal = ({ keyReactivationRequests, onProcess, onClose, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const api = useApi();

    const [step, setStep] = useState<STEPS>(STEPS.LOADING);
    const [oldPassword, setOldPassword] = useState<string>('');
    const [states, setStates] = useState<KeyReactivationRequestState[]>([]);

    const notifyError = (error: string) => {
        createNotification({ type: 'error', text: error });
    };

    const onReactivation = (id: string, result: 'ok' | Error) => {
        const newResult = {
            status: result === 'ok' ? Status.SUCCESS : Status.ERROR,
            result,
        };
        setStates((oldKeys) => {
            return updateKey(oldKeys, id, newResult);
        });
    };

    const getKeyByID = (id: string): KeyReactivationRequestStateData => {
        for (const state of states) {
            const keyState = state.keysToReactivate.find((keyState) => {
                return keyState.id === id;
            });
            if (keyState) {
                return keyState;
            }
        }
        throw new Error('Key ID not found');
    };

    const handleProcess = (promise: Promise<void>) => {
        setStep(STEPS.PROCESS);
        promise
            .then(() => {
                setStep(STEPS.DONE);
            })
            .catch(() => {
                setStep(STEPS.FAILURE);
            });
    };

    useEffect(() => {
        const run = async () => {
            const initialStates = await getInitialStates(keyReactivationRequests);
            setStates(initialStates);
            setStep(STEPS.INFO);
        };
        void run();
    }, []);

    const { children, ...stepProps } = (() => {
        if (step === STEPS.LOADING) {
            return {
                submit: c('Action').t`Continue`,
                children: <Loader />,
            };
        }

        if (step === STEPS.INFO) {
            const uploadButton = (
                <InlineLinkButton key="0" onClick={() => setStep(STEPS.OR_UPLOAD)}>
                    {c('Info').t`uploading a backup key`}
                </InlineLinkButton>
            );

            return {
                submit: c('Action').t`Continue`,
                onSubmit: () => setStep(STEPS.OR_PASSWORD),
                children: (
                    <>
                        <Alert>
                            {c('Info')
                                .t`To reactivate keys, you will be prompted to enter your previous login password from before your account was reset`}
                        </Alert>
                        <ReactivateKeysList states={states} />
                        <Alert>{c('Info').jt`You can also reactivate your keys by ${uploadButton}`}</Alert>
                    </>
                ),
            };
        }

        if (step === STEPS.OR_UPLOAD) {
            const handleUpload = (ID: string, keys: OpenPGPKey[]) => {
                const privateKeys = keys.filter((key) => key.isPrivate());
                if (privateKeys.length === 0) {
                    return notifyError(c('Error').t`Invalid private key file`);
                }
                const keyState = getKeyByID(ID);

                const matchingKeys = privateKeys.filter((key) => key.getFingerprint() === keyState.fingerprint);
                if (matchingKeys.length === 0) {
                    return notifyError(c('Error').t`Uploaded key does not match fingerprint`);
                }

                const [uploadedPrivateKey] = matchingKeys;

                if (uploadedPrivateKey.isDecrypted()) {
                    uploadedPrivateKey
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore - validate does not exist in the openpgp typings, todo
                        .validate()
                        .then(() => {
                            return setStates((oldKeys) => {
                                return updateKey(oldKeys, ID, { uploadedPrivateKey });
                            });
                        })
                        .catch((e: Error) => {
                            notifyError(e.message);
                        });
                    return;
                }

                createModal(
                    <DecryptFileKeyModal
                        privateKey={uploadedPrivateKey}
                        onSuccess={(privateKey) => {
                            setStates((oldKeys) => updateKey(oldKeys, ID, { uploadedPrivateKey: privateKey }));
                        }}
                    />
                );
            };

            const passwordButton = (
                <InlineLinkButton key="0" onClick={() => setStep(STEPS.INFO)}>
                    {c('Info').t`entering your old password`}
                </InlineLinkButton>
            );

            return {
                onSubmit: () => {
                    const onlyUploadedPrivateKeys = getUploadedPrivateKeys(states);
                    if (!onlyUploadedPrivateKeys.length) {
                        return onClose?.();
                    }
                    setStates(onlyUploadedPrivateKeys);
                    const records = onlyUploadedPrivateKeys.map((keyReactivationRecordState) => {
                        return {
                            ...keyReactivationRecordState,
                            keysToReactivate: keyReactivationRecordState.keysToReactivate.map(
                                ({ id, Key, uploadedPrivateKey }) => {
                                    return {
                                        id,
                                        Key,
                                        privateKey: uploadedPrivateKey,
                                    };
                                }
                            ),
                        };
                    });
                    handleProcess(onProcess(records, '', onReactivation));
                },
                children: (
                    <>
                        <Alert>
                            {c('Info')
                                .t`If the backup key has been encrypted, you will be prompted to enter the password to decrypt it`}
                        </Alert>
                        <ReactivateKeysList states={states} onUpload={handleUpload} />
                        <Alert>{c('Info').jt`You can also reactivate your keys by ${passwordButton}`}</Alert>
                    </>
                ),
            };
        }

        if (step === STEPS.OR_PASSWORD) {
            return {
                close: c('Action').t`Back`,
                onClose: () => {
                    setStep(STEPS.INFO);
                },
                onSubmit: async () => {
                    const keySalts = await api<{ KeySalts: KeySalt[] }>(getKeySalts())
                        .then(({ KeySalts }) => KeySalts)
                        .catch(() => []);

                    const result = await Promise.all(
                        states.map(async (keyReactivationRecordState) => {
                            const { process, errors } = await getReactivatedKeys(
                                keyReactivationRecordState.keysToReactivate,
                                oldPassword,
                                keySalts
                            );
                            errors.forEach(({ id, error }) => {
                                onReactivation(id, error);
                            });
                            if (!process.length) {
                                return;
                            }
                            return {
                                ...keyReactivationRecordState,
                                keysToReactivate: process,
                            };
                        })
                    );
                    const records = result.filter(isTruthy);
                    handleProcess(onProcess(records, oldPassword, onReactivation));
                },
                children: (
                    <>
                        <Label htmlFor="password">
                            {c('Label').t`Enter your previous password from before your account was reset:`}
                        </Label>
                        <Field>
                            <PasswordInput
                                id="password"
                                value={oldPassword}
                                onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
                                    setOldPassword(value)
                                }
                                autoFocus
                                required
                            />
                        </Field>
                    </>
                ),
            };
        }

        if (step === STEPS.PROCESS) {
            return {
                loading: true,
                submit: c('Action').t`Submit`,
                children: (
                    <>
                        <ReactivateKeysList loading states={states} />
                        <Alert>
                            {c('Info')
                                .t`If a key remains inactive, it means that the decryption password provided does not apply to the key.`}
                        </Alert>
                    </>
                ),
            };
        }

        if (step === STEPS.DONE) {
            return {
                submit: null,
                children: (
                    <>
                        <ReactivateKeysList states={states} />
                        <Alert>
                            {c('Info')
                                .t`If a key remains inactive, it means that the decryption password provided does not apply to the key.`}
                        </Alert>
                    </>
                ),
            };
        }

        if (step === STEPS.FAILURE) {
            return {
                submit: null,
                children: <GenericError />,
            };
        }

        throw new Error('Unsupported step');
    })();

    return (
        <FormModal
            title={c('Title').t`Re-activate keys`}
            close={c('Action').t`Close`}
            submit={c('Action').t`Submit`}
            onClose={onClose}
            onSubmit={onClose}
            {...stepProps}
            {...rest}
        >
            {children}
        </FormModal>
    );
};

export default ReactivateKeysModal;
