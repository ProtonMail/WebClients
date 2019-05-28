import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Alert, FormModal } from 'react-components';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { KEY_FILE_EXTENSION } from 'proton-shared/lib/constants';

const ExportPublicKeyModal = ({ name, privateKey, onClose, ...rest }) => {
    const handleSubmit = () => {
        const fingerprint = privateKey.getFingerprint();
        const filename = ['publickey.', name, '-', fingerprint, KEY_FILE_EXTENSION].join('');
        const armoredPublicKey = privateKey.toPublic().armor();
        const blob = new Blob([armoredPublicKey], { type: 'data:text/plain;charset=utf-8;' });
        downloadFile(blob, filename);
        onClose();
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

ExportPublicKeyModal.propTypes = {
    onClose: PropTypes.func,
    privateKey: PropTypes.object.isRequired,
    name: PropTypes.string.isRequired
};

export default ExportPublicKeyModal;
