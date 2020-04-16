import React, { useState, useRef } from 'react';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { FormModal, useNotifications, useModals, Alert, GenericError } from '../../../index';

import ImportKeysList from './ImportKeysList';
import SelectKeyFiles from '../shared/SelectKeyFiles';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';
import { ImportKey, OnProcessArguments, Status } from './interface';
import { FileInputHandle } from '../../../components/input/FileInput';

enum STEPS {
    WARNING = 1,
    SELECT_FILES = 2,
    PROCESS = 3,
    DONE = 4,
    FAILURE = 5
}

interface Props {
    onClose?: () => void;
    onProcess: (args: OnProcessArguments) => Promise<void>;
}
const ImportKeyModal = ({ onClose, onProcess, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const selectRef = useRef<FileInputHandle>(null);

    const [step, setStep] = useState<STEPS>(STEPS.WARNING);
    const [keys, setKeys] = useState<ImportKey[]>([]);

    const handleSubmit = (keysToImport: ImportKey[]) => {
        setStep(STEPS.PROCESS);
        onProcess({ keysToImport, setKeysToImport: setKeys })
            .then(() => {
                setStep(STEPS.DONE);
            })
            .catch(() => {
                setStep(STEPS.FAILURE);
            });
    };

    const handleUpload = (privateKeys: ImportKey[], acc: ImportKey[]) => {
        const [first, ...rest] = privateKeys;

        if (privateKeys.length === 0) {
            handleSubmit(acc);
            return;
        }

        const handleAddKey = (decryptedPrivateKey: OpenPGPKey, fingerprint: string) => {
            const newKey = {
                privateKey: decryptedPrivateKey,
                fingerprint,
                status: Status.LOADING,
                result: undefined
            };
            const newList = [...acc, newKey];
            setKeys(newList);
            handleUpload(rest, newList);
        };

        if (first.privateKey.isDecrypted()) {
            first.privateKey
                // @ts-ignore - validate does not exist in the openpgp typings, todo
                .validate()
                .then(() => {
                    handleAddKey(first.privateKey, first.fingerprint);
                })
                .catch((e: Error) => {
                    return createNotification({
                        type: 'error',
                        text: e.message
                    });
                });
            return;
        }

        return createModal(
            <DecryptFileKeyModal
                privateKey={first.privateKey}
                onSuccess={(decryptedPrivateKey) => {
                    handleAddKey(decryptedPrivateKey, first.fingerprint);
                }}
            />
        );
    };

    const handleFiles = (keys: OpenPGPKey[]) => {
        const privateKeys = keys.filter((key) => key.isPrivate());
        if (privateKeys.length === 0) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Invalid private key file`
            });
        }
        const list = privateKeys.map((privateKey) => {
            return {
                fingerprint: privateKey.getFingerprint(),
                privateKey,
                status: Status.LOADING,
                result: undefined
            };
        });
        handleUpload(list, []);
    };

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
                onSubmit: () => selectRef.current?.click(),
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

export default ImportKeyModal;
