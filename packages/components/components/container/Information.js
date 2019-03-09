import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-components';

const Information = ({ icon, children }) => {
    return (
        <div className="information-panel bordered-container relative">
            <div className="information-panel-image flex bg-global-light">
                <Icon name={icon} />
            </div>
            <div className="information-panel-content">{children}</div>
        </div>
    );
};

Information.propTypes = {
    icon: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired
};

Information.defaultProps = {
    icon: 'info'
};

export default Information;
