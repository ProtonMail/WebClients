import React from 'react';
import PropTypes from 'prop-types';
import { Route } from 'react-router';
import { Sidebar } from 'react-components';

import AuthHeader from './AuthHeader';

const AuthLayout = ({ children }) => {
    return (
        <>
            <AuthHeader />
            <div className="flex flex-nowrap">
                <Route path="/:path" render={() => <Sidebar />} />
                <div className="main flex-item-fluid main-area">
                    <div className="flex flex-reverse">{children}</div>
                </div>
            </div>
        </>
    );
};

AuthLayout.propTypes = {
    children: PropTypes.node.isRequired
};

export default AuthLayout;
