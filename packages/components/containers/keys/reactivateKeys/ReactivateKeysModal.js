import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    useApi,
    Alert,
    Field,
    Label,
    PasswordInput,
    useNotifications,
    useAuthenticationStore,
    useEventManager,
    useModals,
    InlineLinkButton,
    FormModal
} from 'react-components';
import { getKeySalts } from 'proton-shared/lib/api/keys';
import createKeysManager from 'proton-shared/lib/keys/keysManager';
import { decryptPrivateKey } from 'pmcrypto';
import { computeKeyPassword } from 'pm-srp';
import { createDecryptionError } from '../shared/DecryptionError';

import ReactivateKeysList, { STATUS } from './ReactivateKeysList';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';

const STEPS = {
    INFO: 0,
    OR_UPLOAD: 1,
    OR_PASSWORD: 2,
    PROCESS: 3,
    DONE: 4,
    FAILURE: 5
};

const getInitialState = (oldAllKeys) => {
    if (oldAllKeys.length === 0) {
        throw new Error('Keys to reactivate needed');
    }

    return oldAllKeys.map(({ User, Address, inactiveKeys, keys }) => {
        return {
            User,
            Address,
            inactiveKeys: inactiveKeys.map(({ Key, privateKey }) => ({
                Key,
                privateKey,
                fingerprint: privateKey.getFingerprint(),
                status: STATUS.INACTIVE
            })),
            keys
        };
    });
};

const updateKey = (oldAllKeys, key, newKey) => {
    return oldAllKeys.map((toReactivate) => {
        const { inactiveKeys: oldInactiveKeys } = toReactivate;

        if (!oldInactiveKeys.some((oldKey) => oldKey === key)) {
            return toReactivate;
        }

        return {
            ...toReactivate,
            inactiveKeys: oldInactiveKeys.map((oldKey) => {
                if (oldKey !== key) {
                    return oldKey;
                }
                return {
                    ...oldKey,
                    ...newKey
                };
            })
        };
    });
};

const getUploadedKeys = (allKeys) => {
    return allKeys
        .map((toReactivate) => {
            const { inactiveKeys } = toReactivate;
            const uploadedKeys = inactiveKeys.filter(({ uploadedPrivateKey }) => !!uploadedPrivateKey);
            if (!uploadedKeys.length) {
                return;
            }
            return {
                ...toReactivate,
                inactiveKeys: uploadedKeys
            };
        })
        .filter(Boolean);
};

export const decryptArmoredKey = async ({ password, keySalt, armoredPrivateKey }) => {
    const keyPassword = keySalt ? await computeKeyPassword(password, keySalt) : password;
    return decryptPrivateKey(armoredPrivateKey, keyPassword).catch(() => {
        throw createDecryptionError();
    });
};

const ReactivateKeysModal = ({ allKeys: initialAllKeys, onClose, ...rest }) => {
    const api = useApi();
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { createModal } = useModals();

    const [step, setStep] = useState(STEPS.INFO);
    const [oldPassword, setOldPassword] = useState('');
    const keySaltsRef = useRef();
    const [loadingKeySalts, setLoadingKeySalts] = useState(false);
    const [allKeys, setAllKeys] = useState(() => getInitialState(initialAllKeys));

    const notifyError = (error) => {
        createNotification({ type: 'error', text: error });
    };

    const startProcess = async () => {
        const newPassword = authenticationStore.getPassword();
        const keySalts = keySaltsRef.current;

        for (const { Address, inactiveKeys, keys } of allKeys) {
            const keysManager = createKeysManager(keys, api);

            for (const inactiveKey of inactiveKeys) {
                const {
                    Key: { ID: keyID, PrivateKey },
                    uploadedPrivateKey
                } = inactiveKey;

                try {
                    if (uploadedPrivateKey) {
                        await keysManager.reactivateKeyByImport({
                            Address,
                            uploadedPrivateKey,
                            password: newPassword
                        });
                    } else {
                        const { KeySalt } = keySalts.find(({ ID: keySaltID }) => keyID === keySaltID) || {};

                        const oldDecryptedPrivateKey = await decryptArmoredKey({
                            armoredPrivateKey: PrivateKey,
                            keySalt: KeySalt,
                            password: oldPassword
                        });

                        await keysManager.reactivateKey({
                            Address,
                            password: newPassword,
                            oldDecryptedPrivateKey
                        });
                    }

                    setAllKeys((oldKeys) => updateKey(oldKeys, inactiveKey, { status: STATUS.SUCCESS, result: 'ok' }));
                } catch (e) {
                    console.error(e);
                    setAllKeys((oldKeys) => updateKey(oldKeys, inactiveKey, { status: STATUS.ERROR, result: e }));
                }
            }
        }

        await call();
    };

    useEffect(() => {
        if (step !== STEPS.PROCESS) {
            return;
        }
        startProcess()
            .then(() => {
                setStep(STEPS.DONE);
            })
            .catch(() => {
                setStep(STEPS.FAILURE);
            });
    }, [step]);

    const { children, ...stepProps } = (() => {
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
                )
            };
        }

        if (step === STEPS.OR_UPLOAD) {
            const handleUpload = (inactiveKey, files) => {
                if (files.length === 0) {
                    return notifyError(c('Error').t`Invalid private key file`);
                }

                const matchingKeys = files.filter((key) => key.getFingerprint() === inactiveKey.fingerprint);
                if (matchingKeys.length === 0) {
                    return notifyError(c('Error').t`Uploaded key does not match fingerprint`);
                }

                const [uploadedPrivateKey] = matchingKeys;

                if (uploadedPrivateKey.isDecrypted()) {
                    return setAllKeys((oldKeys) =>
                        updateKey(oldKeys, inactiveKey, {
                            uploadedPrivateKey
                        })
                    );
                }

                createModal(
                    <DecryptFileKeyModal
                        privateKey={uploadedPrivateKey}
                        onSuccess={(privateKey) => {
                            setAllKeys((oldKeys) =>
                                updateKey(oldKeys, inactiveKey, {
                                    uploadedPrivateKey: privateKey
                                })
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
                        return onClose();
                    }
                    setAllKeys(onlyUploadedKeys);
                    setStep(STEPS.PROCESS);
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
                )
            };
        }

        if (step === STEPS.OR_PASSWORD) {
            return {
                loading: loadingKeySalts,
                onSubmit: async () => {
                    try {
                        setLoadingKeySalts(true);
                        keySaltsRef.current = await api(getKeySalts()).then(({ KeySalts }) => KeySalts);
                        setStep(STEPS.PROCESS);
                    } catch (e) {
                        setLoadingKeySalts(false);
                    }
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
                                onChange={({ target: { value } }) => setOldPassword(value)}
                                autoFocus={true}
                                required
                            />
                        </Field>
                    </>
                )
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
                )
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
                )
            };
        }

        if (step === STEPS.FAILURE) {
            return {
                submit: c('Action').t`Ok`,
                children: <Alert type="error">{c('Error').t`Something went wrong`}</Alert>
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

ReactivateKeysModal.propTypes = {
    allKeys: PropTypes.array.isRequired,
    onClose: PropTypes.func
};

export default ReactivateKeysModal;
