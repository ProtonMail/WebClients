import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

const Hamburger = ({ sidebarId, expanded = true, onToggle }) => {
    return (
        <button
            type="button"
            className="hamburger nodesktop notablet"
            aria-expanded={expanded}
            aria-controls={sidebarId}
            onClick={onToggle}
        >
            <Icon className="fill-currentColor" name="burger" />
        </button>
    );
};

Hamburger.propTypes = {
    expanded: PropTypes.bool,
    onToggle: PropTypes.func.isRequired,
    sidebarId: PropTypes.string
};

export default Hamburger;
