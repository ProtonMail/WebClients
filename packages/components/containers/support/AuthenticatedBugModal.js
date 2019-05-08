import React from 'react';
import PropTypes from 'prop-types';
import { useUser, useAddresses } from 'react-components';

import BugModal from './BugModal';

const AuthenticatedBugModal = ({ onClose }) => {
    const [{ Name = '' }] = useUser();
    const [addresses = []] = useAddresses();
    return <BugModal username={Name} addresses={addresses} onClose={onClose} />;
};

AuthenticatedBugModal.propTypes = {
    onClose: PropTypes.func.isRequired
};

export default AuthenticatedBugModal;
