import React from 'react';
import { getKeys, OpenPGPKey } from 'pmcrypto';
import { c } from 'ttag';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { KEY_FILE_EXTENSION } from '@proton/shared/lib/constants';
import { Alert, FormModal } from '../../../components';

const handleExport = (name: string, publicKey: OpenPGPKey) => {
    const fingerprint = publicKey.getFingerprint();
    const filename = ['publickey.', name, '-', fingerprint, KEY_FILE_EXTENSION].join('');
    const armoredPublicKey = publicKey.armor();
    const blob = new Blob([armoredPublicKey], { type: 'data:text/plain;charset=utf-8;' });
    downloadFile(blob, filename);
};

interface Props {
    name: string;
    fallbackPrivateKey: string;
    publicKey?: OpenPGPKey;
    onSuccess?: () => void;
    onClose?: () => void;
}

const ExportPublicKeyModal = ({ name, fallbackPrivateKey, publicKey, onClose, ...rest }: Props) => {
    const handleSubmit = async () => {
        if (publicKey) {
            handleExport(name, publicKey);
        } else {
            // If there is no publicKey, it means the private key couldn't be decrypted, so just use whatever was received from the server
            const [key] = await getKeys(fallbackPrivateKey);
            const publicKey = key.toPublic();
            handleExport(name, publicKey);
        }
        onClose?.();
    };

    return (
        <FormModal
            title={c('Title').t`Export public key`}
            close={c('Action').t`Close`}
            submit={c('Action').t`Export`}
            onClose={onClose}
            onSubmit={handleSubmit}
            {...rest}
        >
            <Alert type="info">
                {c('Info')
                    .t`Give your public key to your friends, or publish it online, so that everyone can send you end-to-end encrypted email!`}
            </Alert>
        </FormModal>
    );
};

export default ExportPublicKeyModal;
