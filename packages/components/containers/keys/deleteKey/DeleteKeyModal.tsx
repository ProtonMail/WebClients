import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import { Alert, GenericError, FormModal } from '../../..';

enum STEPS {
    WARNING = 1,
    EXPORT_KEY = 2,
    DELETE_KEY = 3,
    SUCCESS = 4,
    FAILURE = 5,
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
                children: (
                    <Alert>
                        {c('Info')
                            .t`This feature is intended for advanced users only! After deleting this key, you will not be able to decrypt any message that is encrypted with this key. It may lead to data loss. Are you sure you want to continue?`}
                    </Alert>
                ),
            };
        }

        if (step === STEPS.EXPORT_KEY) {
            return {
                onSubmit: async () => {
                    await onExport?.();
                    setStep(STEPS.DELETE_KEY);
                },
                onClose: () => {
                    setStep(STEPS.DELETE_KEY);
                },
                close: c('Action').t`No`,
                children: (
                    <Alert>
                        {c('alert')
                            .t`Deleting your keys is irreversible. To be able to access any message encrypted with this key, you might want to make a back up of this key for later use. Do you want to export this key?`}
                    </Alert>
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
                children: <Alert>{c('Info').jt`Key with fingerprint ${fp} deleted`}</Alert>,
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
        <FormModal
            title={c('Title').t`Delete key`}
            submit={c('Action').t`Yes`}
            onClose={onClose}
            onSubmit={onClose}
            {...stepProps}
            {...rest}
        >
            {children}
        </FormModal>
    );
};

export default DeleteKeyModal;
