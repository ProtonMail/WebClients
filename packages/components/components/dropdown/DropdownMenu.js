import React from 'react';
import PropTypes from 'prop-types';

const DropdownMenu = ({ children, className }) => {
    return (
        <ul className={`unstyled mt0-5 mb0-5 ${className}`}>
            {React.Children.map(children, (child) => {
                return (
                    <li className={`dropDown-item`} key={child.key}>
                        {child}
                    </li>
                );
            })}
        </ul>
    );
};

DropdownMenu.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

DropdownMenu.defaultProps = {
    className: ''
};

export default DropdownMenu;
