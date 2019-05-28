import React, { useState } from 'react';
import { KEY_FILE_EXTENSION } from 'proton-shared/lib/constants';
import { encryptPrivateKey } from 'pmcrypto';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { useModals, UnlockModal, Alert, Row, Field, Label, PasswordInput, FormModal } from 'react-components';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import { generateUID } from '../../../helpers/component';

const ExportPrivateKeyModal = ({ name, privateKey, onSuccess, onClose, ...rest }) => {
    const { createModal } = useModals();

    if (!privateKey.isDecrypted()) {
        throw new Error('Key must be decrypted');
    }

    const [id] = useState(() => generateUID('exportKey'));
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        // Force a login since the private key is sensitive
        await new Promise((resolve, reject) => {
            createModal(<UnlockModal onClose={() => reject()} onSuccess={resolve} />);
        });

        const fingerprint = privateKey.getFingerprint();
        const filename = ['privatekey.', name, '-', fingerprint, KEY_FILE_EXTENSION].join('');
        const armoredEncryptedKey = await encryptPrivateKey(privateKey, password);
        const blob = new Blob([armoredEncryptedKey], { type: 'data:text/plain;charset=utf-8;' });
        downloadFile(blob, filename);
        onSuccess && onSuccess();
        onClose();
    };

    return (
        <FormModal
            title={c('Title').t`Export private key`}
            close={c('Action').t`Close`}
            submit={c('Action').t`Export`}
            onClose={onClose}
            onSubmit={handleSubmit}
            {...rest}
        >
            <Alert type="warning">
                {c('Info')
                    .t`IMPORTANT: Downloading your private keys and sending them over or storing them on insecure media can jeopardise the security of your account!`}
            </Alert>
            <Alert>{c('Info').t`Please enter a password to encrypt your private key with before exporting.`}</Alert>
            <Row>
                <Label htmlFor={id}>{c('Label').t`Enter password`}</Label>
                <Field>
                    <PasswordInput
                        id={id}
                        value={password}
                        onChange={({ target: { value } }) => setPassword(value)}
                        placeholder={c('Placeholder').t`Password`}
                        autoFocus={true}
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

ExportPrivateKeyModal.propTypes = {
    onClose: PropTypes.func,
    onSuccess: PropTypes.func,
    privateKey: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired
};

export default ExportPrivateKeyModal;
