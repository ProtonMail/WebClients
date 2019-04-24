import React from 'react';
import PropTypes from 'prop-types';
import { useUser, useAddresses } from 'react-components';

import BugModal from './BugModal';

const AuthenticatedBugModal = ({ show, onClose }) => {
    const [{ Name = '' }] = useUser();
    const [addresses = []] = useAddresses();
    return <BugModal username={Name} addresses={addresses} show={show} onClose={onClose} />;
};

AuthenticatedBugModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default AuthenticatedBugModal;
