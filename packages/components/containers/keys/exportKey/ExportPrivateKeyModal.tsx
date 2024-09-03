import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import generateUID from '@proton/atoms/generateUID';
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { KEY_FILE_EXTENSION } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../../components';
import {
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    PasswordInputTwo,
    useFormErrors,
} from '../../../components';
import { useModals } from '../../../hooks';
import UnlockModal from '../../login/UnlockModal';

const handleExport = async (name: string, privateKey: PrivateKeyReference, password: string) => {
    const fingerprint = privateKey.getFingerprint();
    const filename = ['privatekey.', name, '-', fingerprint, KEY_FILE_EXTENSION].join('');
    const armoredEncryptedKey = await CryptoProxy.exportPrivateKey({ privateKey: privateKey, passphrase: password });
    const blob = new Blob([armoredEncryptedKey], { type: 'text/plain' });
    downloadFile(blob, filename);
};

interface Props extends ModalProps {
    name: string;
    privateKey: PrivateKeyReference;
    onSuccess?: () => void;
}

const ExportPrivateKeyModal = ({ name, privateKey, onSuccess, onClose, ...rest }: Props) => {
    const { createModal } = useModals();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const [id] = useState(() => generateUID('exportKey'));
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        // Force a login since the private key is sensitive
        await new Promise<string>((resolve, reject) => {
            createModal(<UnlockModal onClose={() => reject()} onSuccess={resolve} />);
        });
        await handleExport(name, privateKey, password);
        onSuccess?.();
        onClose?.();
    };

    const handleClose = loading ? noop : onClose;

    return (
        <Modal
            as={Form}
            onSubmit={() => {
                if (!onFormSubmit()) {
                    return;
                }

                void withLoading(handleSubmit());
            }}
            onClose={handleClose}
            {...rest}
        >
            <ModalHeader title={c('Title').t`Export private key`} />
            <ModalContent>
                <div className="mb-4">
                    {c('Info')
                        .t`This will download a file containing your private key. Protect this file by encrypting it with a password.`}
                </div>
                <InputFieldTwo
                    id={id}
                    as={PasswordInputTwo}
                    label={c('Label').t`Create password`}
                    placeholder={c('Placeholder').t`Password`}
                    value={password}
                    onValue={setPassword}
                    error={validator([passwordLengthValidator(password)])}
                    autoFocus
                />
                <div>
                    {c('Info')
                        .t`Store this password and file in a safe place. You’ll need them again to import your key.`}
                </div>
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>

                <Button loading={loading} type="submit" color="norm">
                    {c('Action').t`Encrypt and export`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ExportPrivateKeyModal;
