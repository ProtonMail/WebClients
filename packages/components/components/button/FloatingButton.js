import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

const FloatingButton = ({ icon, title, ...rest }) => {
    return (
        <button type="button" className="compose-fab pm-button--primary flex" {...rest}>
            <Icon size={25} fill="white" className="mauto" name={icon} />
            {title ? <span className="sr-only">{title}</span> : null}
        </button>
    );
};

FloatingButton.propTypes = {
    icon: PropTypes.string.isRequired,
    title: PropTypes.string
};

export default FloatingButton;
