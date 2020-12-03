import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { Alert, FormModal, ErrorButton, Button } from '../../../components';
import GenericError from '../../error/GenericError';

enum STEPS {
    WARNING = 1,
    EXPORT_KEY = 2,
    DELETE_KEY = 3,
    SUCCESS = 4,
    FAILURE = 5,
    CONFIRM_DELETE = 6,
}

interface Props {
    onClose?: () => void;
    fingerprint: string;
    onDelete: () => Promise<void>;
    onExport?: () => Promise<void>;
}
const DeleteKeyModal = ({ onClose, fingerprint, onDelete, onExport, ...rest }: Props) => {
    const [step, setStep] = useState(STEPS.WARNING);

    useEffect(() => {
        if (step !== STEPS.DELETE_KEY) {
            return;
        }
        onDelete()
            .then(() => {
                setStep(STEPS.SUCCESS);
            })
            .catch(() => {
                setStep(STEPS.FAILURE);
            });
    }, [step]);

    const { children, ...stepProps } = (() => {
        if (step === STEPS.WARNING) {
            return {
                onSubmit: () => {
                    setStep(onExport ? STEPS.EXPORT_KEY : STEPS.DELETE_KEY);
                },
                submit: <ErrorButton type="submit">{c('Action').t`Delete`}</ErrorButton>,
                children: (
                    <>
                        <Alert>
                            {c('Info')
                                .t`This feature is intended for advanced users only. After deleting this key, you will NOT be able to decrypt any message that has been encrypted with it. It may lead to data loss.`}
                        </Alert>
                        <Alert type="error">
                            {c('Confirm').t`Are you sure you want to permanently delete this key?`}
                        </Alert>
                    </>
                ),
            };
        }

        if (step === STEPS.EXPORT_KEY) {
            return {
                onSubmit: async () => {
                    await onExport?.();
                    setStep(STEPS.DELETE_KEY);
                },
                title: c('Action').t`Export key`,
                close: <Button onClick={() => setStep(STEPS.CONFIRM_DELETE)}>{c('Action').t`No`}</Button>,
                submit: c('Action').t`Export`,
                children: (
                    <>
                        <Alert>
                            {c('Alert')
                                .t`Deleting your keys is irreversible. To be able to access any message encrypted with this, you might want to make a backup of this key for later use.`}
                        </Alert>
                        <Alert>{c('Confirm').t`Do you want to export your key?`}</Alert>
                    </>
                ),
            };
        }

        if (step === STEPS.CONFIRM_DELETE) {
            return {
                onSubmit: async () => {
                    setStep(STEPS.DELETE_KEY);
                },
                title: c('Action').t`Warning`,
                close: <Button onClick={() => setStep(STEPS.EXPORT_KEY)}>{c('Action').t`No`}</Button>,
                submit: <ErrorButton type="submit">{c('Action').t`Yes`}</ErrorButton>,
                children: (
                    <>
                        <Alert type="error">
                            {c('Alert').t`You will face a permanent data loss by not making a backup of your key.`}
                        </Alert>
                        <Alert type="error">
                            {c('Confirm').t`Are you sure you want to delete this key without backing it up?`}
                        </Alert>
                    </>
                ),
            };
        }

        if (step === STEPS.DELETE_KEY) {
            return {
                submit: c('Action').t`Done`,
                loading: true,
                children: <Alert>{c('alert').t`The key for your address is now being deleted.`}</Alert>,
            };
        }

        if (step === STEPS.SUCCESS) {
            const fp = <code key="0">{fingerprint}</code>;
            return {
                submit: c('Action').t`Done`,
                children: <Alert>{c('Info').jt`Key with fingerprint ${fp} has been deleted.`}</Alert>,
            };
        }

        if (step === STEPS.FAILURE) {
            return {
                submit: c('Action').t`Ok`,
                children: <GenericError />,
            };
        }

        throw new Error('Unsupported step');
    })();

    return (
        <FormModal title={c('Title').t`Delete key`} onClose={onClose} onSubmit={onClose} {...stepProps} {...rest}>
            {children}
        </FormModal>
    );
};

export default DeleteKeyModal;
