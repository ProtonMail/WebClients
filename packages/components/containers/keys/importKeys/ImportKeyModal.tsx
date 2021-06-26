import React, { useRef, useState } from 'react';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { getRandomString } from '@proton/shared/lib/helpers/string';
import { OnKeyImportCallback } from '@proton/shared/lib/keys';

import { Alert, FormModal } from '../../../components';
import { useModals, useNotifications } from '../../../hooks';
import GenericError from '../../error/GenericError';

import ImportKeysList from './ImportKeysList';
import SelectKeyFiles from '../shared/SelectKeyFiles';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';
import { ImportKey, Status } from './interface';
import { updateKey } from './state';

const getNewKey = (privateKey: OpenPGPKey) => {
    return {
        id: getRandomString(12),
        privateKey,
        fingerprint: privateKey.getFingerprint(),
        status: Status.LOADING,
        result: undefined,
    };
};

enum STEPS {
    WARNING = 1,
    SELECT_FILES = 2,
    PROCESS = 3,
    DONE = 4,
    FAILURE = 5,
}

interface Props {
    onClose?: () => void;
    onProcess: (keys: ImportKey[], cb: OnKeyImportCallback) => Promise<void>;
}

const ImportKeyModal = ({ onClose, onProcess, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const selectRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<STEPS>(STEPS.WARNING);
    const [state, setState] = useState<ImportKey[]>([]);

    const handleSubmit = (promise: Promise<void>) => {
        setStep(STEPS.PROCESS);
        promise
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
            handleSubmit(
                onProcess(acc, (id: string, result) => {
                    setState((oldKeys) => {
                        return updateKey(oldKeys, id, {
                            status: result === 'ok' ? Status.SUCCESS : Status.ERROR,
                            result,
                        });
                    });
                })
            );
            return;
        }

        const handleAddKey = (decryptedPrivateKey: OpenPGPKey) => {
            const newList = [...acc, getNewKey(decryptedPrivateKey)];
            setState(newList);
            handleUpload(rest, newList);
        };

        if (first.privateKey.isDecrypted()) {
            first.privateKey
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore - validate does not exist in the openpgp typings, todo
                .validate()
                .then(() => {
                    handleAddKey(first.privateKey);
                })
                .catch((e: Error) => {
                    createNotification({
                        type: 'error',
                        text: e.message,
                    });
                });
            return;
        }

        return createModal(
            <DecryptFileKeyModal
                privateKey={first.privateKey}
                onSuccess={(decryptedPrivateKey) => {
                    handleAddKey(decryptedPrivateKey);
                }}
            />
        );
    };

    const handleFiles = (keys: OpenPGPKey[]) => {
        const privateKeys = keys.filter((key) => key.isPrivate());
        if (privateKeys.length === 0) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Invalid private key file`,
            });
        }
        const list = privateKeys.map<ImportKey>((privateKey) => {
            return getNewKey(privateKey);
        });
        handleUpload(list, []);
    };

    const { children, ...stepProps } = (() => {
        if (step === STEPS.WARNING) {
            return {
                submit: c('Action').t`Import`,
                onSubmit: () => {
                    setStep(STEPS.SELECT_FILES);
                },
                children: (
                    <Alert>
                        {c('Alert')
                            .t`Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.`}
                    </Alert>
                ),
            };
        }

        if (step === STEPS.SELECT_FILES) {
            return {
                submit: c('Action').t`Select files`,
                onSubmit: () => selectRef.current?.click(),
                children: (
                    <>
                        <Alert>{c('Label').t`Please select files to upload`}</Alert>
                        <SelectKeyFiles ref={selectRef} onFiles={handleFiles} multiple className="hidden" autoClick />
                    </>
                ),
            };
        }

        if (step === STEPS.PROCESS) {
            return {
                submit: c('Action').t`Select files`,
                loading: true,
                children: <ImportKeysList keys={state} />,
            };
        }

        if (step === STEPS.DONE) {
            return {
                submit: null,
                children: <ImportKeysList keys={state} />,
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
            title={c('Title').t`Import key`}
            close={c('Action').t`Close`}
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
