import { useRef, useState } from 'react';
import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { getRandomString } from '@proton/shared/lib/helpers/string';
import { OnKeyImportCallback } from '@proton/shared/lib/keys';

import {
    Alert,
    Button,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '../../../components';
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

interface Props extends ModalProps {
    onProcess: (keys: ImportKey[], cb: OnKeyImportCallback) => Promise<void>;
}

const ImportKeyModal = ({ onProcess, ...rest }: Props) => {
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

        createModal(
            <DecryptFileKeyModal
                privateKey={first.privateKey}
                onSuccess={(decryptedPrivateKey) => {
                    handleAddKey(decryptedPrivateKey);
                }}
            />
        );
    };

    const handleUploadKeys = (keys: OpenPGPKey[]) => {
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

    const { children, submit, onNext, loading } = (() => {
        if (step === STEPS.WARNING) {
            return {
                submit: c('Action').t`Import`,
                loading: false,
                onNext: () => {
                    setStep(STEPS.SELECT_FILES);
                },
                children: (
                    <Alert className="text-pre-wrap">
                        {c('Import key')
                            .t`Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.

Please also note that the public key corresponding to this private key will be publicly available from our key server. If the key contains personal details (such as your full name) which you do not want to publish, please edit the key before importing it.`}
                    </Alert>
                ),
            };
        }

        if (step === STEPS.SELECT_FILES) {
            return {
                submit: c('Action').t`Select files`,
                loading: false,
                onNext: () => selectRef.current?.click(),
                children: (
                    <>
                        <Alert className="mb1">{c('Label').t`Please select files to upload`}</Alert>
                        <SelectKeyFiles
                            ref={selectRef}
                            onUpload={handleUploadKeys}
                            multiple
                            className="hidden"
                            autoClick
                        />
                    </>
                ),
            };
        }

        if (step === STEPS.PROCESS) {
            return {
                submit: c('Action').t`Select files`,
                onNext: undefined,
                loading: true,
                children: <ImportKeysList keys={state} />,
            };
        }

        if (step === STEPS.DONE) {
            return {
                submit: null,
                onNext: undefined,
                loading: false,
                children: <ImportKeysList keys={state} />,
            };
        }

        if (step === STEPS.FAILURE) {
            return {
                submit: null,
                onNext: undefined,
                loading: false,
                children: <GenericError />,
            };
        }

        throw new Error('Unsupported step');
    })();

    return (
        <ModalTwo size="large" {...rest}>
            <ModalTwoHeader title={c('Title').t`Import key`} />
            <ModalTwoContent>{children}</ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} className={submit === null ? 'mlauto' : undefined}>
                    {submit === null ? c('Action').t`Close` : c('Action').t`Cancel`}
                </Button>
                {submit !== null && (
                    <Button color="norm" onClick={onNext} loading={loading}>
                        {submit || c('Action').t`Save`}
                    </Button>
                )}
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ImportKeyModal;
