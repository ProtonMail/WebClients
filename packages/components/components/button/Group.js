import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const Group = ({ children, className = '' }) => (
    <div className={classnames(['pm-group-buttons', className])}>{children}</div>
);

Group.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Group;
