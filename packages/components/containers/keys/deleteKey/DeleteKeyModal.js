import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, GenericError, FormModal, useEventManager, useModals, useApi } from 'react-components';
import { removeKey } from 'proton-shared/lib/keys/keysManager';
import ExportPrivateKeyModal from '../exportKey/ExportPrivateKeyModal';
import { removeKeyRoute } from 'proton-shared/lib/api/keys';
import getSignedKeyList from 'proton-shared/lib/keys/getSignedKeyList';

const STEPS = {
    WARNING: 1,
    EXPORT_KEY: 2,
    DELETE_KEY: 3,
    SUCCESS: 4,
    FAILURE: 5
};

const DeleteKeyModal = ({ onClose, Address, addressKeys, KeyID, privateKey, ...rest }) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();

    const [step, setStep] = useState(STEPS.WARNING);

    const deleteKey = async () => {
        const updatedKeys = removeKey({ keys: addressKeys, keyID: KeyID });
        await api(removeKeyRoute({ ID: KeyID, SignedKeyList: await getSignedKeyList(updatedKeys) }));
        await call();
    };

    useEffect(() => {
        if (step !== STEPS.DELETE_KEY) {
            return;
        }
        deleteKey()
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
                onSubmit: () => {
                    setStep(privateKey.isDecrypted() ? STEPS.EXPORT_KEY : STEPS.DELETE_KEY);
                },
                children: (
                    <Alert>
                        {c('Info')
                            .t`This feature is intended for advanced users only! After deleting this key, you will not be able to decrypt any message that is encrypted with this key. It may lead to data loss. Are you sure you want to continue?`}
                    </Alert>
                )
            };
        }

        if (step === STEPS.EXPORT_KEY) {
            return {
                onSubmit: async () => {
                    const { Email } = Address;
                    await new Promise((resolve, reject) => {
                        createModal(
                            <ExportPrivateKeyModal
                                onClose={reject}
                                onSuccess={resolve}
                                name={Email}
                                privateKey={privateKey}
                            />
                        );
                    });
                    setStep(STEPS.DELETE_KEY);
                },
                close: c('Action').t`Cancel`,
                children: (
                    <Alert>
                        {c('alert')
                            .t`Deleting your keys is irreversible. To be able to access any message encrypted with this key, you might want to make a back up of this key for later use. Do you want to export this key?`}
                    </Alert>
                )
            };
        }

        if (step === STEPS.DELETE_KEY) {
            return {
                submit: c('Action').t`Done`,
                loading: true,
                children: <Alert>{c('alert').t`We are now deleting the key for your address.`}</Alert>
            };
        }

        if (step === STEPS.DONE) {
            const fp = <code key="0">{privateKey.getFingerprint()}</code>;
            return {
                submit: c('Action').t`Done`,
                children: <Alert>{c('Info').jt`Key with fingerprint ${fp} deleted`}</Alert>
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

DeleteKeyModal.propTypes = {
    onClose: PropTypes.func,
    KeyID: PropTypes.string.isRequired,
    privateKey: PropTypes.object.isRequired,
    Address: PropTypes.object.isRequired,
    addressKeys: PropTypes.array.isRequired
};

export default DeleteKeyModal;
