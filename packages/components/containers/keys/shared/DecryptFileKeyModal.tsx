import React, { ChangeEvent, useState } from 'react';
import { decryptPrivateKey, OpenPGPKey } from 'pmcrypto';
import { c } from 'ttag';
import { Alert, Row, Label, Field, PasswordInput, FormModal } from '../../../components';

import { generateUID } from '../../../helpers';

interface Props {
    privateKey: OpenPGPKey;
    onSuccess: (privateKey: OpenPGPKey) => void;
    onClose?: () => void;
}
const DecryptFileKeyModal = ({ privateKey, onSuccess, onClose, ...rest }: Props) => {
    const id = generateUID('decryptKey');
    const fingerprint = privateKey.getFingerprint();
    const fingerprintCode = <code key="0">{fingerprint}</code>;

    const [password, setPassword] = useState('');
    const [decrypting, setDecrypting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        try {
            setDecrypting(true);
            setError('');

            const decryptedPrivateKey = await decryptPrivateKey(privateKey.armor(), password);

            onSuccess(decryptedPrivateKey);
            onClose?.();
        } catch (e) {
            setError(e.message);
            setDecrypting(false);
        }
    };

    return (
        <FormModal
            title={c('Title').t`Decrypt key`}
            loading={decrypting}
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
                        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => setPassword(value)}
                        autoFocus
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

export default DecryptFileKeyModal;
