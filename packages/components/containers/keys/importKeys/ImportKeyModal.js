import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    useApi,
    useAuthentication,
    FormModal,
    useEventManager,
    useNotifications,
    useModals,
    Alert,
    GenericError
} from 'react-components';
import { getKeys } from 'pmcrypto';
import { findKeyByFingerprint } from 'proton-shared/lib/keys/keysReducer';
import { reformatAddressKey } from 'proton-shared/lib/keys/keys';

import ImportKeysList, { STATUS } from './ImportKeysList';
import SelectKeyFiles from '../shared/SelectKeyFiles';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';
import { createKeyHelper, reactivateKeyHelper } from '../shared/actionHelper';

const STEPS = {
    WARNING: 1,
    SELECT_FILES: 2,
    PROCESS: 3,
    DONE: 4,
    FAILURE: 5
};

const addKey = (oldKeys, uploadedPrivateKey) => {
    return [...oldKeys, { uploadedPrivateKey, fingerprint: uploadedPrivateKey.getFingerprint() }];
};

const updateKey = (oldKeys, key, newKey) => {
    return oldKeys.map((oldKey) => {
        if (oldKey === key) {
            return { ...oldKey, ...newKey };
        }
        return oldKey;
    });
};

const ImportKeyModal = ({ Address, addressKeys, onClose, ...rest }) => {
    const api = useApi();
    const authentication = useAuthentication();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const selectRef = useRef();

    const [step, setStep] = useState(STEPS.WARNING);
    const [keys, setKeys] = useState([]);

    const startProcess = async () => {
        const newPassword = authentication.getPassword();
        let updatedAddressKeys = addressKeys;

        for (const key of keys) {
            try {
                const { uploadedPrivateKey } = key;

                const maybeOldKeyContainer = findKeyByFingerprint(
                    updatedAddressKeys,
                    uploadedPrivateKey.getFingerprint()
                );
                if (maybeOldKeyContainer) {
                    if (maybeOldKeyContainer.privateKey.isDecrypted()) {
                        throw new Error(c('Error').t`Key is already decrypted`);
                    }

                    const {
                        Key: { ID: keyID, PrivateKey }
                    } = maybeOldKeyContainer;

                    // When reactivating a key by importing it, get the email from the old armored private key to ensure it's correct for the contact keys
                    const [oldPrivateKey] = await getKeys(PrivateKey);

                    const { email } = oldPrivateKey.users[0].userId;
                    const { privateKey: reformattedPrivateKey, privateKeyArmored } = await reformatAddressKey({
                        email,
                        passphrase: newPassword,
                        privateKey: uploadedPrivateKey
                    });

                    updatedAddressKeys = await reactivateKeyHelper({
                        api,
                        keyID,
                        privateKey: reformattedPrivateKey,
                        privateKeyArmored,
                        keys: updatedAddressKeys,
                        Address
                    });
                } else {
                    const { privateKey: reformattedPrivateKey, privateKeyArmored } = await reformatAddressKey({
                        email: Address.Email,
                        passphrase: newPassword,
                        privateKey: uploadedPrivateKey
                    });

                    updatedAddressKeys = await createKeyHelper({
                        api,
                        privateKey: reformattedPrivateKey,
                        privateKeyArmored,
                        Address,
                        keys: updatedAddressKeys
                    });
                }

                setKeys((oldKeys) => updateKey(oldKeys, key, { status: STATUS.SUCCESS }));
            } catch (e) {
                setKeys((oldKeys) => updateKey(oldKeys, key, { status: STATUS.ERROR, result: e }));
            }
        }

        await call();
    };

    const handleUpload = (privateKeys) => {
        const [privateKey, ...restKeys] = privateKeys;

        if (privateKeys.length === 0) {
            setStep(STEPS.PROCESS);
            return;
        }

        if (privateKey.isDecrypted()) {
            setKeys((oldKeys) => addKey(oldKeys, privateKey));
            handleUpload(restKeys);
            return;
        }

        return createModal(
            <DecryptFileKeyModal
                privateKey={privateKey}
                onSuccess={(decryptedPrivateKey) => {
                    setKeys((oldKeys) => addKey(oldKeys, decryptedPrivateKey));
                    handleUpload(restKeys);
                }}
            />
        );
    };

    const handleFiles = (keys) => {
        const privateKeys = keys.filter((key) => key.isPrivate());
        if (privateKeys.length === 0) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Invalid private key file`
            });
        }
        handleUpload(privateKeys);
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
        if (step === STEPS.WARNING) {
            return {
                submit: c('Action').t`Yes`,
                onSubmit: () => {
                    setStep(STEPS.SELECT_FILES);
                },
                children: (
                    <Alert>
                        {c('Alert')
                            .t`Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.`}
                    </Alert>
                )
            };
        }

        if (step === STEPS.SELECT_FILES) {
            return {
                submit: c('Action').t`Select files`,
                onSubmit: () => selectRef.current.click(),
                children: (
                    <>
                        <Alert>{c('Label').t`Please select files to upload`}</Alert>
                        <SelectKeyFiles
                            ref={selectRef}
                            onFiles={handleFiles}
                            multiple={true}
                            className="hidden"
                            autoClick={true}
                        />
                    </>
                )
            };
        }

        if (step === STEPS.PROCESS) {
            return {
                submit: c('Action').t`Done`,
                loading: true,
                children: <ImportKeysList keys={keys} />
            };
        }

        if (step === STEPS.DONE) {
            return {
                submit: c('Action').t`Done`,
                children: <ImportKeysList keys={keys} />
            };
        }

        if (step === STEPS.FAILURE) {
            return {
                submit: c('Action').t`Ok`,
                children: <GenericError />
            };
        }

        throw new Error('Unsupported step');
    })();

    return (
        <FormModal
            title={c('Title').t`Import key`}
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

ImportKeyModal.propTypes = {
    onClose: PropTypes.func,
    Address: PropTypes.object.isRequired,
    addressKeys: PropTypes.array.isRequired
};

export default ImportKeyModal;
