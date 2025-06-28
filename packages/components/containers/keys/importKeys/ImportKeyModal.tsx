import { useRef, useState } from 'react';

import { c } from 'ttag';

import { useUserSettings } from '@proton/account';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModals from '@proton/components/hooks/useModals';
import useNotifications from '@proton/components/hooks/useNotifications';
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy, KeyCompatibilityLevel } from '@proton/crypto';
import type { ArmoredKeyWithInfo, OnKeyImportCallback } from '@proton/shared/lib/keys';
import getRandomString from '@proton/utils/getRandomString';

import GenericError from '../../error/GenericError';
import getPausedForwardingNotice from '../changePrimaryKeyForwardingNotice/getPausedForwardingNotice';
import DecryptFileKeyModal from '../shared/DecryptFileKeyModal';
import SelectKeyFiles from '../shared/SelectKeyFiles';
import ImportKeysList from './ImportKeysList';
import type { ImportKey } from './interface';
import { Status } from './interface';
import { updateKey } from './state';

const getNewKey = (privateKey: PrivateKeyReference): ImportKey => {
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
    hasOutgoingE2EEForwardings: boolean;
}

const ImportKeyModal = ({ onProcess, hasOutgoingE2EEForwardings, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const selectRef = useRef<HTMLInputElement>(null);
    const [
        {
            Flags: { SupportPgpV6Keys },
        },
    ] = useUserSettings();

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

    const handleUpload = (privateKeyInfos: ArmoredKeyWithInfo[], acc: ImportKey[]) => {
        const [first, ...rest] = privateKeyInfos;

        if (privateKeyInfos.length === 0) {
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

        const handleAddKey = (decryptedPrivateKey: PrivateKeyReference) => {
            const newList = [...acc, getNewKey(decryptedPrivateKey)];
            setState(newList);
            handleUpload(rest, newList);
        };

        if (first.keyIsDecrypted) {
            CryptoProxy.importPrivateKey({
                armoredKey: first.armoredKey,
                passphrase: null,
                // the BE will enforce this as well, but the returned error messages might be less user friendly
                checkCompatibility: SupportPgpV6Keys
                    ? KeyCompatibilityLevel.V6_COMPATIBLE
                    : KeyCompatibilityLevel.BACKWARDS_COMPATIBLE,
            })
                .then(handleAddKey)
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
                privateKeyInfo={first}
                onSuccess={(decryptedPrivateKey) => {
                    handleAddKey(decryptedPrivateKey);
                }}
            />
        );
    };

    const handleUploadKeys = (keys: ArmoredKeyWithInfo[]) => {
        const privateKeyInfos = keys.filter(({ keyIsPrivate }) => keyIsPrivate);
        if (privateKeyInfos.length === 0) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Invalid private key file`,
            });
        }

        handleUpload(privateKeyInfos, []);
    };

    const { children, submit, onNext, loading } = (() => {
        if (step === STEPS.WARNING) {
            const pausedForwardingNotice = getPausedForwardingNotice();
            return {
                submit: c('Action').t`Import`,
                loading: false,
                onNext: () => {
                    setStep(STEPS.SELECT_FILES);
                },
                children: (
                    <>
                        <div className="text-pre-wrap">
                            {c('Import key')
                                .t`Are you sure you want to import a private key? Importing an insecurely generated or leaked private key can harm the security of your emails.

Please also note that the public key corresponding to this private key will be publicly available from our key server. If the key contains personal details (such as your full name) which you do not want to publish, please edit the key before importing it.`}
                        </div>
                        {hasOutgoingE2EEForwardings ? (
                            <div className="border rounded-lg p-4 flex flex-nowrap items-center mb-3 mt-4">
                                <Icon name="exclamation-circle" className="shrink-0 color-warning" />
                                <p className="text-sm color-weak flex-1 pl-4 my-0">{pausedForwardingNotice}</p>
                            </div>
                        ) : null}
                    </>
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
                        <div>{c('Label').t`Please select files to upload`}</div>
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
        <ModalTwo size="medium" {...rest}>
            <ModalTwoHeader title={c('Title').t`Import key`} />
            <ModalTwoContent>{children}</ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={rest.onClose} className={submit === null ? 'ml-auto' : undefined}>
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
