import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import type { ArmoredKeyWithInfo } from '@proton/shared/lib/keys';
import generateUID from '@proton/utils/generateUID';
import noop from '@proton/utils/noop';

import { InputFieldTwo, PasswordInputTwo, useFormErrors } from '../../../components';

interface Props extends ModalProps {
    privateKeyInfo: ArmoredKeyWithInfo;
    onSuccess: (privateKey: PrivateKeyReference) => void;
}

const DecryptFileKeyModal = ({ privateKeyInfo, onSuccess, onClose, ...rest }: Props) => {
    const id = generateUID('decryptKey');
    const { fingerprint, armoredKey } = privateKeyInfo;
    const fingerprintCode = <code key="0">{fingerprint}</code>;

    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        try {
            const decryptedPrivateKey = await CryptoProxy.importPrivateKey({
                armoredKey,
                passphrase: password,
                checkCompatibility: true, // the BE will enforce this as well, but the returned error messages might be less user friendly
            });
            onSuccess(decryptedPrivateKey);
            onClose?.();
        } catch (e: any) {
            setError(e.message);
        }
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
            <ModalHeader title={c('Title').t`Decrypt key`} />
            <ModalContent>
                <div className="mb-4">
                    {c('Label').jt`Enter the password for key with fingerprint: ${fingerprintCode}`}
                </div>

                <InputFieldTwo
                    id={id}
                    as={PasswordInputTwo}
                    label={c('Label').t`Enter password`}
                    placeholder={c('Placeholder').t`Password`}
                    value={password}
                    onValue={(value: string) => {
                        setError('');
                        setPassword(value);
                    }}
                    error={validator([requiredValidator(password), error])}
                    autoFocus
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Close`}
                </Button>

                <Button loading={loading} type="submit" color="norm">
                    {c('Action').t`Decrypt`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default DecryptFileKeyModal;
