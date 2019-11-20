import React from 'react';
import PropTypes from 'prop-types';
import { UserDropdown } from 'react-components';

import { classnames } from '../../helpers/component';

const TopNavbar = ({ children, className = '' }) => {
    const navIcons = React.Children.count(children);

    return (
        <div
            className={classnames([
                'flex flex-justify-end topnav-container flex-item-centered-vert flex-item-fluid',
                className
            ])}
        >
            <ul
                className={classnames([
                    'topnav-list unstyled mt0 mb0 ml1 flex flex-nowrap flex-items-center',
                    navIcons === 4 && 'topnav-list--four-elements'
                ])}
            >
                {React.Children.map(children, (child) => {
                    return (
                        child && (
                            <li className="mr1 flex-item-noshrink">
                                {React.cloneElement(child, {
                                    className: 'topnav-link inline-flex flex-nowrap nodecoration'
                                })}
                            </li>
                        )
                    );
                })}
                <li className="mtauto mbauto relative">
                    <UserDropdown />
                </li>
            </ul>
        </div>
    );
};

TopNavbar.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default TopNavbar;
