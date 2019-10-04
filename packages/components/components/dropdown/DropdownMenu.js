import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const DropdownMenu = ({ children, className = '' }) => {
    return (
        <div className="dropDown-content">
            <ul className={classnames(['unstyled mt0 mb0 ml1 mr1', className])}>
                {React.Children.toArray(children).map((child) => {
                    return (
                        <li className="dropDown-item" key={child.key}>
                            {child}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

DropdownMenu.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default DropdownMenu;
