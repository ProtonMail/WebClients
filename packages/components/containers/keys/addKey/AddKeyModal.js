import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, FormModal, useEventManager, useAuthenticationStore, useApi } from 'react-components';
import { getAlgorithmExists } from 'proton-shared/lib/keys/keysAlgorithm';
import createKeysManager from 'proton-shared/lib/keys/keysManager';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS } from 'proton-shared/lib/constants';

import SelectEncryption from './SelectEncryption';

const STEPS = {
    SELECT_ENCRYPTION: 1,
    WARNING: 2,
    GENERATE_KEY: 3,
    SUCCESS: 4,
    FAILURE: 5
};

const AddKeyModal = ({ onClose, Address, addressKeys, ...rest }) => {
    const authenticationStore = useAuthenticationStore();
    const api = useApi();
    const { call } = useEventManager();

    const [step, setStep] = useState(STEPS.SELECT_ENCRYPTION);
    const [encryptionType, setEncryptionType] = useState(DEFAULT_ENCRYPTION_CONFIG);
    const [newKeyFingerprint, setNewKeyFingerprint] = useState();

    const generateKey = async () => {
        const encryptionConfig = ENCRYPTION_CONFIGS[encryptionType];
        const keysManager = createKeysManager(addressKeys, api);

        const { privateKey } = await keysManager.createAddressKey({
            Address,
            password: authenticationStore.getPassword(),
            encryptionConfig
        });
        await call();
        setNewKeyFingerprint(privateKey.getFingerprint());
    };

    useEffect(() => {
        if (step !== STEPS.GENERATE_KEY) {
            return;
        }
        generateKey()
            .then(() => {
                setStep(STEPS.DONE);
            })
            .catch(() => {
                setStep(STEPS.FAILURE);
            });
    }, [step]);

    const { children, ...stepProps } = (() => {
        if (step === STEPS.SELECT_ENCRYPTION) {
            return {
                onSubmit: () => {
                    const addressKeysAlgorithms = addressKeys.map(({ privateKey }) => privateKey.getAlgorithmInfo());
                    const encryptionConfig = ENCRYPTION_CONFIGS[encryptionType];
                    const algorithmExists = getAlgorithmExists(addressKeysAlgorithms, encryptionConfig);

                    setStep(algorithmExists ? STEPS.WARNING : STEPS.GENERATE_KEY);
                },
                children: (
                    <>
                        <Alert>
                            {c('Info')
                                .t`You can generate a new encryption key if you think your previous key has been compromised.`}
                        </Alert>
                        <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />
                    </>
                )
            };
        }

        if (step === STEPS.WARNING) {
            return {
                onSubmit: () => setStep(STEPS.GENERATE_KEY),
                submit: c('Action').t`Yes`,
                children: (
                    <Alert type="warning">
                        {c('Info')
                            .t`A key with the same encryption algorithm is already active for this address. Generating another key will cause slower account loading and deletion of this key can cause issues. If you are generating a new key because your old key is compromised, please mark that key as compromised. Are you sure you want to continue?`}
                    </Alert>
                )
            };
        }

        if (step === STEPS.GENERATE_KEY) {
            return {
                submit: c('Action').t`Done`,
                loading: true,
                children: (
                    <Alert>
                        {c('alert')
                            .t`We are now generating encryption keys for your address, this may take several minutes and temporarily freeze your browser.`}
                    </Alert>
                )
            };
        }

        if (step === STEPS.DONE) {
            const fp = <code key="0">{newKeyFingerprint}</code>;
            return {
                submit: c('Action').t`Done`,
                children: <Alert>{c('Info').jt`Key with fingerprint ${fp} successfully created`}</Alert>
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
            title={c('Title').t`Create key`}
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

AddKeyModal.propTypes = {
    onClose: PropTypes.func,
    Address: PropTypes.object.isRequired,
    addressKeys: PropTypes.array.isRequired
};

export default AddKeyModal;
