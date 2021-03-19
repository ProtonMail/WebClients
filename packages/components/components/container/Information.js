import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../icon/Icon';

const Information = ({ icon = 'info', children }) => {
    return (
        <div className="information-panel w100 bordered relative flex flex-column">
            <div className="information-panel-image flex bg-weak">
                <Icon name={icon} className="mauto" />
            </div>
            <div className="information-panel-content flex h100  flex-column">{children}</div>
        </div>
    );
};

Information.propTypes = {
    icon: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

export default Information;
