import { useState } from 'react';
import { c } from 'ttag';
import { AlgorithmInfo } from '@proton/crypto';
import { getAlgorithmExists } from '@proton/shared/lib/keys';
import { DEFAULT_ENCRYPTION_CONFIG, ENCRYPTION_CONFIGS, ENCRYPTION_TYPES } from '@proton/shared/lib/constants';
import { EncryptionConfig } from '@proton/shared/lib/interfaces';
import {
    Alert,
    Button,
    Form,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '../../../components';

import SelectEncryption from './SelectEncryption';

enum STEPS {
    SELECT_ENCRYPTION = 1,
    WARNING = 2,
    GENERATE_KEY = 3,
    SUCCESS = 4,
}

interface Props extends ModalProps {
    type: 'user' | 'address';
    existingAlgorithms: AlgorithmInfo[];
    onAdd: (config: EncryptionConfig) => Promise<string>;
}

const AddKeyModal = ({ existingAlgorithms, type, onAdd, ...rest }: Props) => {
    const [step, setStep] = useState(STEPS.SELECT_ENCRYPTION);
    const [encryptionType, setEncryptionType] = useState<ENCRYPTION_TYPES>(DEFAULT_ENCRYPTION_CONFIG);
    const [newKeyFingerprint, setNewKeyFingerprint] = useState<string>();

    const handleProcess = () => {
        onAdd(ENCRYPTION_CONFIGS[encryptionType])
            .then((fingerprint) => {
                setNewKeyFingerprint(fingerprint);
                setStep(STEPS.SUCCESS);
            })
            .catch(() => {
                rest.onClose?.();
            });
    };

    const { children, onSubmit, submit, close, loading } = (() => {
        if (step === STEPS.SELECT_ENCRYPTION) {
            return {
                onSubmit: () => {
                    const encryptionConfig = ENCRYPTION_CONFIGS[encryptionType];
                    const algorithmExists = getAlgorithmExists(existingAlgorithms, encryptionConfig);

                    const nextStep = algorithmExists ? STEPS.WARNING : STEPS.GENERATE_KEY;
                    setStep(nextStep);
                    if (nextStep === STEPS.GENERATE_KEY) {
                        handleProcess();
                    }
                },
                submit: c('Action').t`Continue`,
                close: undefined,
                loading: false,
                children: (
                    <>
                        <Alert className="mb1">
                            {c('Key generation')
                                .t`You can generate a new encryption key if you think your previous key has been compromised.`}
                        </Alert>
                        <SelectEncryption encryptionType={encryptionType} setEncryptionType={setEncryptionType} />
                    </>
                ),
            };
        }

        if (step === STEPS.WARNING) {
            return {
                onSubmit: () => {
                    setStep(STEPS.GENERATE_KEY);
                    handleProcess();
                },
                close: c('Action').t`No`,
                submit: c('Action').t`Continue`,
                loading: false,
                children: (
                    <Alert className="mb1" type="warning">
                        {type === 'user'
                            ? c('Key generation')
                                  .t`A key with the same encryption algorithm already exists. Generating another key will cause slower account loading. Are you sure you want to continue?`
                            : c('Key generation')
                                  .t`A key with the same encryption algorithm is already active for this address. Generating another key will cause slower account loading and deletion of this key can cause issues. If you are generating a new key because your old key is compromised, please mark that key as compromised. Are you sure you want to continue?`}
                    </Alert>
                ),
            };
        }

        if (step === STEPS.GENERATE_KEY) {
            return {
                onSubmit: undefined,
                loading: true,
                submit: c('Action').t`Continue`,
                close: undefined,
                children: (
                    <Alert className="mb1">
                        {type === 'user'
                            ? // Translator: encryption keys are referred to "contact encryption keys"
                              c('Key generation')
                                  .t`The encryption keys are being generated. This may take several minutes and temporarily freeze your browser.`
                            : c('Key generation')
                                  .t`The encryption keys for your address are being generated. This may take several minutes and temporarily freeze your browser.`}
                    </Alert>
                ),
            };
        }

        if (step === STEPS.SUCCESS) {
            const fp = <code key="0">{newKeyFingerprint}</code>;
            return {
                onSubmit: undefined,
                close: c('Action').t`Close`,
                submit: null,
                loading: false,
                children: (
                    <Alert className="mb1">{c('Key generation')
                        .jt`Key with fingerprint ${fp} successfully created.`}</Alert>
                ),
            };
        }

        throw new Error('Unsupported step');
    })();

    return (
        <ModalTwo as={Form} onSubmit={onSubmit} size="large" {...rest}>
            <ModalTwoHeader title={c('Key generation').t`Generate key`} />
            <ModalTwoContent>{children}</ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} className={submit === null ? 'mlauto' : undefined}>
                    {close || c('Action').t`Cancel`}
                </Button>
                {submit !== null && (
                    <Button color="norm" type="submit" loading={loading}>
                        {submit || c('Action').t`Save`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default AddKeyModal;
