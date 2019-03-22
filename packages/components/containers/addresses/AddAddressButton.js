import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PrimaryButton, useModal } from 'react-components';

import AddressModal from './AddressModal';

const AddAddressButton = ({ loading, member }) => {
    const { isOpen, open, close } = useModal();
    return (
        <>
            <PrimaryButton disabled={loading} onClick={open}>{c('Action').t`Add address`}</PrimaryButton>
            <AddressModal show={isOpen} onClose={close} member={member} />
        </>
    );
};

AddAddressButton.propTypes = {
    loading: PropTypes.bool,
    member: PropTypes.object.isRequired
};

export default AddAddressButton;
