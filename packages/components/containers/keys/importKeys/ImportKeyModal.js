import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    useApi,
    useAuthenticationStore,
    FormModal,
    useEventManager,
    useNotifications,
    useModals,
    Alert
} from 'react-components';
import createKeysManager from 'proton-shared/lib/keys/keysManager';

import SelectKeyFiles from '../shared/SelectKeyFiles';
import ImportKeysList, { STATUS } from './ImportKeysList';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';

const STEPS = {
    WARNING: 1,
    SELECT_FILES: 2,
    PROCESS: 3,
    DONE: 4,
    FAILURE: 5
};

const addKey = (oldKeys, privateKey) => {
    return [...oldKeys, { privateKey, fingerprint: privateKey.getFingerprint() }];
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
    const authenticationStore = useAuthenticationStore();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const selectRef = useRef();

    const [step, setStep] = useState(STEPS.WARNING);
    const [keys, setKeys] = useState([]);

    const startProcess = async () => {
        const keysManager = createKeysManager(addressKeys, api);
        const newPassword = authenticationStore.getPassword();

        for (const key of keys) {
            try {
                const { privateKey } = key;

                await keysManager.importKey({
                    Address,
                    uploadedPrivateKey: privateKey,
                    password: newPassword
                });

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

    const handleFiles = (files) => {
        if (files.length === 0) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Invalid private key file`
            });
        }
        handleUpload(files);
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
                        <SelectKeyFiles ref={selectRef} onFiles={handleFiles} multiple={true} autoClick={true} />
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
                children: <Alert type="error">{c('Error').t`Something went wrong`}</Alert>
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
