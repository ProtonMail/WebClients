import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { PrimaryButton, useModals } from 'react-components';

import AddressModal from './AddressModal';

const AddAddressButton = ({ loading, member }) => {
    const { createModal } = useModals();

    return (
        <PrimaryButton disabled={loading} onClick={() => createModal(<AddressModal member={member} />)}>
            {c('Action').t`Add address`}
        </PrimaryButton>
    );
};

AddAddressButton.propTypes = {
    loading: PropTypes.bool,
    member: PropTypes.object.isRequired
};

export default AddAddressButton;
