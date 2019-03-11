import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { ConfirmModal, Toggle, Alert, useApiWithoutResult, useModal } from 'react-components';
import { updateAttachPublicKey, updateSign } from 'proton-shared/lib/api/mailSettings';

const AttachPublicKeyToggle = ({ id, attachPublicKey, sign }) => {
    const { isOpen, open, close } = useModal();
    const { request, loading } = useApiWithoutResult(updateAttachPublicKey);
    const { request: requestSign } = useApiWithoutResult(updateSign);
    const [value, setValue] = useState(!!attachPublicKey);
    const handleConfirmSign = async () => {
        await requestSign(1);
        // TODO call event manager
    };
    const handleChange = async (newValue) => {
        askSign();
        await request(+newValue);
        // TODO call event manager
        setValue(newValue);
    };
    const askSign = (newValue) => {
        if (!newValue || sign) {
            return false;
        }
        open();
    };
    return (
        <>
            <Toggle id={id} value={value} onChange={handleChange} disabled={loading} />
            <ConfirmModal
                show={isOpen}
                onClose={close}
                confirm={c('Action').t`Yes`}
                cancel={c('Action').t`No`}
                title={c('Title').t`Automatic sign outgoing messages?`}
                onConfirm={handleConfirmSign}
            >
                <Alert>{c('Info')
                    .t`PGP clients are more likely to automatically detect your PGP keys if outgoing messages are signed.`}</Alert>
            </ConfirmModal>
        </>
    );
};

AttachPublicKeyToggle.propTypes = {
    id: PropTypes.string,
    attachPublicKey: PropTypes.number.isRequired,
    sign: PropTypes.number.isRequired
};

export default AttachPublicKeyToggle;
