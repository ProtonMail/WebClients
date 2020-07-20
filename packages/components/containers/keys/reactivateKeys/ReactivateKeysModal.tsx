import React, { useState, useEffect, ChangeEvent } from 'react';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import {
    Alert,
    Field,
    Label,
    PasswordInput,
    useNotifications,
    useModals,
    InlineLinkButton,
    FormModal,
    GenericError,
    Loader,
} from '../../../index';

import ReactivateKeysList from './ReactivateKeysList';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';
import { KeyReactivation, OnProcessArguments, ReactivateKey, ReactivateKeys } from './interface';
import { getInitialState, getUploadedKeys, updateKey } from './state';

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
    allKeys: KeyReactivation[];
    onProcess: (args: OnProcessArguments) => Promise<void>;
}
const ReactivateKeysModal = ({ allKeys: initialAllKeys, onProcess, onClose, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    const [step, setStep] = useState<STEPS>(STEPS.LOADING);
    const [oldPassword, setOldPassword] = useState<string>('');
    const [allKeys, setAllKeys] = useState<ReactivateKeys[]>([]);

    const notifyError = (error: string) => {
        createNotification({ type: 'error', text: error });
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
            const initialKeysState = await getInitialState(initialAllKeys);
            setAllKeys(initialKeysState);
            setStep(STEPS.INFO);
        };
        run();
    }, []);

    const { children, ...stepProps } = (() => {
        if (step === STEPS.LOADING) {
            return {
                submit: null,
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
                submit: c('Action').t`Re-activate`,
                onSubmit: () => setStep(STEPS.OR_PASSWORD),
                children: (
                    <>
                        <Alert>
                            {c('Info')
                                .t`To reactivate keys, you will be prompted to enter your previous login password from before your account was reset`}
                        </Alert>
                        <ReactivateKeysList allKeys={allKeys} />
                        <Alert>{c('Info').jt`You can also reactivate your keys by ${uploadButton}`}</Alert>
                    </>
                ),
            };
        }

        if (step === STEPS.OR_UPLOAD) {
            const handleUpload = (inactiveKey: ReactivateKey, keys: OpenPGPKey[]) => {
                const privateKeys = keys.filter((key) => key.isPrivate());
                if (privateKeys.length === 0) {
                    return notifyError(c('Error').t`Invalid private key file`);
                }

                const matchingKeys = privateKeys.filter((key) => key.getFingerprint() === inactiveKey.fingerprint);
                if (matchingKeys.length === 0) {
                    return notifyError(c('Error').t`Uploaded key does not match fingerprint`);
                }

                const [uploadedPrivateKey] = matchingKeys;

                if (uploadedPrivateKey.isDecrypted()) {
                    uploadedPrivateKey
                        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
                        // @ts-ignore - validate does not exist in the openpgp typings, todo
                        .validate()
                        .then(() => {
                            return setAllKeys((oldKeys) => {
                                return updateKey(oldKeys, inactiveKey, { uploadedPrivateKey });
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
                            setAllKeys((oldKeys) =>
                                updateKey(oldKeys, inactiveKey, { uploadedPrivateKey: privateKey })
                            );
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
                submit: c('Action').t`Re-activate`,
                onSubmit: () => {
                    const onlyUploadedKeys = getUploadedKeys(allKeys);
                    if (!onlyUploadedKeys.length) {
                        return onClose?.();
                    }
                    setAllKeys(onlyUploadedKeys);
                    handleProcess(
                        onProcess({
                            keysToReactivate: onlyUploadedKeys,
                            setKeysToReactivate: setAllKeys,
                            isUploadMode: true,
                        })
                    );
                },
                children: (
                    <>
                        <Alert>
                            {c('Info')
                                .t`If the backup key has been encrypted, you will be prompted to enter the password to decrypt it`}
                        </Alert>
                        <ReactivateKeysList allKeys={allKeys} onUpload={handleUpload} />
                        <Alert>{c('Info').jt`You can also reactivate your keys by ${passwordButton}`}</Alert>
                    </>
                ),
            };
        }

        if (step === STEPS.OR_PASSWORD) {
            return {
                onSubmit: async () => {
                    handleProcess(
                        onProcess({
                            setKeysToReactivate: setAllKeys,
                            keysToReactivate: allKeys,
                            isUploadMode: false,
                            oldPassword,
                        })
                    );
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
                                autoFocus={true}
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
                submit: c('Action').t`Done`,
                children: (
                    <>
                        <ReactivateKeysList loading={true} allKeys={allKeys} />
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
                submit: c('Action').t`Done`,
                children: (
                    <>
                        <ReactivateKeysList allKeys={allKeys} />
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
                submit: c('Action').t`Ok`,
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
