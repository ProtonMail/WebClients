import React from 'react';
import PropTypes from 'prop-types';
import { Icon, Tooltip } from 'react-components';

const ContactGroupIcon = ({ name, color }) => {
    return (
        <Tooltip title={name}>
            <Icon name="contacts-groups" color={color} />
        </Tooltip>
    );
};

ContactGroupIcon.propTypes = {
    name: PropTypes.string,
    color: PropTypes.string
};

export default ContactGroupIcon;
