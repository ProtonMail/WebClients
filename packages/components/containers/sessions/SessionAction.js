import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Badge, SmallButton } from 'react-components';

const SessionAction = ({ session, onRevoke, currentUID }) => {
    if (currentUID === session.UID) {
        return <Badge>{c('Badge for user sessions table').t`Current session`}</Badge>;
    }

    return <SmallButton onClick={onRevoke}>{c('Action for user session').t`Revoke`}</SmallButton>;
};

SessionAction.propTypes = {
    session: PropTypes.object.isRequired,
    onRevoke: PropTypes.func.isRequired,
    currentUID: PropTypes.string.isRequired
};

export default SessionAction;