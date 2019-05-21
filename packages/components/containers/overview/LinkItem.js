import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Tooltip, Icon } from 'react-components';
import { c } from 'ttag';

const LinkItem = ({ route, text, permission }) => {
    return (
        <Link to={route}>
            <span className="mr1">{text}</span>
            {permission ? null : (
                <Tooltip title={c('Tag').t`Premium feature`}>
                    <Icon name="starfull" fill="attention" />
                </Tooltip>
            )}
        </Link>
    );
};

LinkItem.propTypes = {
    route: PropTypes.string,
    permission: PropTypes.bool,
    text: PropTypes.string
};

export default LinkItem;
