import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Icon } from 'react-components';

const LinkItem = ({ route, text, permission }) => {
    return (
        <Link to={route}>
            {text} {permission ? null : <Icon name="protonmail" />}
        </Link>
    );
};

LinkItem.propTypes = {
    route: PropTypes.string,
    permission: PropTypes.bool,
    text: PropTypes.string
};

export default LinkItem;
