import { ChangeEvent, useState } from 'react';
import { OpenPGPKey, encryptPrivateKey } from 'pmcrypto';
import { KEY_FILE_EXTENSION } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { c } from 'ttag';

import { Alert, Row, Field, Label, PasswordInput, FormModal } from '../../../components';
import { useModals } from '../../../hooks';
import UnlockModal from '../../login/UnlockModal';
import { generateUID } from '../../../helpers';

const handleExport = async (name: string, privateKey: OpenPGPKey, password: string) => {
    const fingerprint = privateKey.getFingerprint();
    const filename = ['privatekey.', name, '-', fingerprint, KEY_FILE_EXTENSION].join('');
    const armoredEncryptedKey = await encryptPrivateKey(privateKey, password);
    const blob = new Blob([armoredEncryptedKey], { type: 'data:text/plain;charset=utf-8;' });
    downloadFile(blob, filename);
};

interface Props {
    name: string;
    privateKey: OpenPGPKey;
    onSuccess?: () => void;
    onClose?: () => void;
}
const ExportPrivateKeyModal = ({ name, privateKey, onSuccess, onClose, ...rest }: Props) => {
    const { createModal } = useModals();

    const [id] = useState(() => generateUID('exportKey'));
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        // Force a login since the private key is sensitive
        await new Promise<void>((resolve, reject) => {
            createModal(<UnlockModal onClose={() => reject()} onSuccess={resolve} />);
        });
        await handleExport(name, privateKey, password);
        onSuccess?.();
        onClose?.();
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
                        onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => setPassword(value)}
                        placeholder={c('Placeholder').t`Password`}
                        autoFocus
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

export default ExportPrivateKeyModal;
