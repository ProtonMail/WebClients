import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Row, Label, Field, PasswordInput, FormModal } from 'react-components';
import { c } from 'ttag';

import { generateUID } from '../../../helpers/component';
import { createDecryptionError } from './DecryptionError';

const DecryptFileKeyModal = ({ privateKey, onSuccess, onClose, ...rest }) => {
    const id = generateUID('decryptKey');
    const fingerprint = privateKey.getFingerprint();
    const fingerprintCode = <code key="0">{fingerprint}</code>;

    const [password, setPassword] = useState('');
    const [decrypting, setDecrypting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        try {
            setDecrypting(true);
            setError();

            if (!(await privateKey.decrypt(password))) {
                throw createDecryptionError();
            }

            onSuccess(privateKey);
            onClose();
        } catch (e) {
            setError(e.message);
            setDecrypting(false);
        }
    };

    return (
        <FormModal
            title={c('Title').t`Decrypt key`}
            loading={!!decrypting}
            submit={c('Action').t`Decrypt`}
            onSubmit={handleSubmit}
            onClose={onClose}
            {...rest}
        >
            <Alert>{c('Label').jt`Enter the password for key with fingerprint: ${fingerprintCode}`}</Alert>
            <Row>
                <Label htmlFor={id}>{c('Label').t`Enter password`}</Label>
                <Field>
                    <PasswordInput
                        id={id}
                        value={password}
                        error={error}
                        onChange={({ target: { value } }) => setPassword(value)}
                        autoFocus={true}
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

DecryptFileKeyModal.propTypes = {
    privateKey: PropTypes.object.isRequired,
    onSuccess: PropTypes.func.isRequired,
    onClose: PropTypes.func
};

export default DecryptFileKeyModal;
