import React from 'react';
import PropTypes from 'prop-types';
import { useUser, useAddresses } from 'react-components';

import BugModal from './BugModal';

const AuthenticatedBugModal = (props) => {
    const [{ Name = '' }] = useUser();
    const [addresses = []] = useAddresses();
    return <BugModal username={Name} addresses={addresses} {...props} />;
};

AuthenticatedBugModal.propTypes = {
    onClose: PropTypes.func
};

export default AuthenticatedBugModal;
