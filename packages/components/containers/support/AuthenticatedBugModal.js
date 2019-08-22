import React from 'react';
import { useUser, useAddresses } from 'react-components';

import BugModal from './BugModal';

const AuthenticatedBugModal = (props) => {
    const [{ Name = '' }] = useUser();
    const [addresses = []] = useAddresses();
    return <BugModal username={Name} addresses={addresses} {...props} />;
};

export default AuthenticatedBugModal;
