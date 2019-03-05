import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SmallButton, ConfirmModal, Alert, useModal } from 'react-components';
import { ADDRESS_TYPE, ADDRESS_STATUS } from 'proton-shared/lib/constants';

const { STATUS_DISABLED, STATUS_ENABLED } = ADDRESS_STATUS;
const { TYPE_ORIGINAL, TYPE_CUSTOM_DOMAIN, TYPE_PREMIUM } = ADDRESS_TYPE;

const AddressActions = ({ address }) => {
    const { Status, Type } = address;
    const { isOpen: showDisable, open: openDisable, close: closeDisable } = useModal();
    const { isOpen: showRemove, open: openRemove, close: closeRemove } = useModal();
    const handleEnable = () => {};
    const handleDisable = () => {};
    const handleRemove = () => {};

    return (
        <>
            {Status === STATUS_DISABLED && Type !== TYPE_ORIGINAL && Type !== TYPE_PREMIUM ? (
                <SmallButton onClick={handleEnable}>{c('Action').t`Enable`}</SmallButton>
            ) : null}
            {Status === STATUS_ENABLED && Type !== TYPE_ORIGINAL && Type !== TYPE_PREMIUM ? (
                <SmallButton onClick={openDisable}>{c('Action').t`Disable`}</SmallButton>
            ) : null}
            <ConfirmModal
                show={showDisable}
                onClose={closeDisable}
                onConfirm={handleDisable}
                title={c('Action').t`Disable address`}
            >
                <Alert>{c('Info').t`Are you sure you want to disable this address?`}</Alert>
            </ConfirmModal>
            {Status === STATUS_DISABLED && Type === TYPE_CUSTOM_DOMAIN ? (
                <SmallButton onClick={openRemove}>{c('Action').t`Remove`}</SmallButton>
            ) : null}
            <ConfirmModal
                show={showRemove}
                onClose={closeRemove}
                onConfirm={handleRemove}
                title={c('Action').t`Disable address`}
            >
                <Alert>{c('Info').t`Are you sure you want to disable this address?`}</Alert>
            </ConfirmModal>
        </>
    );
};

AddressActions.propTypes = {
    address: PropTypes.object.isRequired
};

export default AddressActions;
