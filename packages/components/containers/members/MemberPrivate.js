import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

const PRIVATE = {
    0: <Icon name="off" />,
    1: <Icon name="on" />
};

const MemberPrivate = ({ member }) => {
    return PRIVATE[member.Private];
};

MemberPrivate.propTypes = {
    member: PropTypes.object.isRequired
};

export default MemberPrivate;
