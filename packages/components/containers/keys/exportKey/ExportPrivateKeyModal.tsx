import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import AuthModal, { type AuthModalResult } from '@proton/components/containers/password/AuthModal';
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { queryUnlock } from '@proton/shared/lib/api/user';
import { KEY_FILE_EXTENSION } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { passwordLengthValidator } from '@proton/shared/lib/helpers/formValidators';
import generateUID from '@proton/utils/generateUID';
import noop from '@proton/utils/noop';

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
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const [authModal, showAuthModal] = useModalTwoPromise<undefined, AuthModalResult>();

    const [id] = useState(() => generateUID('exportKey'));
    const [password, setPassword] = useState('');

    const handleSubmit = async () => {
        // Force a login since the private key is sensitive
        await showAuthModal();
        await handleExport(name, privateKey, password);
        onSuccess?.();
        onClose?.();
    };

    const handleClose = loading ? noop : onClose;

    return (
        <>
            {authModal((props) => {
                return (
                    <AuthModal
                        {...props}
                        scope="locked"
                        config={queryUnlock()}
                        onCancel={props.onReject}
                        onSuccess={props.onResolve}
                    />
                );
            })}
            <Modal
                as={Form}
                onSubmit={() => {
                    if (!onFormSubmit()) {
                        return;
                    }

                    void withLoading(handleSubmit()).catch(noop);
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
        </>
    );
};

export default ExportPrivateKeyModal;
