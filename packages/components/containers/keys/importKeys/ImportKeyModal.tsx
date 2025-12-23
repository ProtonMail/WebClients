import { useRef, useState } from 'react';

import { c } from 'ttag';

import { importKeysThunk } from '@proton/account/addressKeys/importKeysActions';
import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import GenericError from '@proton/components/containers/error/GenericError';
import getPausedForwardingNotice from '@proton/components/containers/keys/changePrimaryKeyForwardingNotice/getPausedForwardingNotice';
import { type ProcessedKey, useProcessKey } from '@proton/components/containers/keys/importKeys/useProcessKey';
import SelectKeyFiles from '@proton/components/containers/keys/shared/SelectKeyFiles';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import getRandomString from '@proton/utils/getRandomString';

import ImportKeysList from './ImportKeysList';
import { type ImportKeyState, Status } from './interface';

const getState = ({ armoredKeyWithInfo, privateKey }: ProcessedKey): ImportKeyState => {
    return {
        importKeyData: {
            id: getRandomString(12),
            privateKey,
        },
        fingerprint: armoredKeyWithInfo.fingerprint,
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
    hasOutgoingE2EEForwardings: boolean;
    address: Address;
}

const ImportKeyModal = ({ hasOutgoingE2EEForwardings, address, ...rest }: Props) => {
    const selectRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const [step, setStep] = useState<STEPS>(STEPS.WARNING);
    const [state, setState] = useState<ImportKeyState[]>([]);

    const handleSubmit = async (importKeyRecords: ProcessedKey[]) => {
        try {
            setStep(STEPS.PROCESS);
            const state = importKeyRecords.map(getState);
            setState(state);
            const result = await dispatch(
                importKeysThunk({
                    importKeyData: state.map(({ importKeyData }) => importKeyData),
                    address,
                })
            );
            const map = result.details.reduce<{ [key: string]: (typeof result.details)[0] }>((acc, cur) => {
                acc[cur.id] = cur;
                return acc;
            }, {});
            setState(
                state.map((keyImportRecord) => {
                    const keyResult = map[keyImportRecord.importKeyData.id];
                    let status: Status;
                    let result;
                    if (keyResult && keyResult.type === 'error') {
                        const { message } = getApiError(keyResult.error);
                        result = message || keyResult.error.message || 'Unknown error';
                        status = Status.ERROR;
                    } else if (keyResult.type === 'success') {
                        status = Status.SUCCESS;
                    } else {
                        status = Status.ERROR;
                        result = 'Unknown error';
                    }
                    return { ...keyImportRecord, status, result };
                })
            );
            setStep(STEPS.DONE);
        } catch (error) {
            setStep(STEPS.FAILURE);
            handleError(error);
        }
    };

    const processKey = useProcessKey({
        onProcessed: (data) => {
            void handleSubmit(data);
        },
    });

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
                            onUpload={processKey.handleUploadKeys}
                            multiple
                            className="hidden"
                            autoClick
                        />
                        {processKey.component}
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
