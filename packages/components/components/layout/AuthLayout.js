import React from 'react';
import PropTypes from 'prop-types';
import { t } from 'ttag';
import { Route } from 'react-router';

import Header from '../header/Header';
import Sidebar from '../sidebar/Sidebar';

const getSettingsSidebar = () => {
    return [
        {
            text: t`Back to Wallet`,
            link: '/summary'
        },
        {
            text: t`Account`,
            link: '/settings/account'
        },
        {
            text: t`Wallets`,
            link: '/settings/wallets'
        },
        {
            text: t`Appearance`,
            link: '/settings/appearance'
        },
        {
            text: t`Notifications`,
            link: '/settings/notifications'
        },
        {
            text: t`Security`,
            link: '/settings/security'
        },
        {
            text: t`Advanced`,
            link: '/settings/advanced'
        }
    ]
};

const getMainSidebar = (logout, notification) => {
    return [
        {
            text: t`Send`,
            type: 'button',
            onClick: () => {
                console.log('Open send modal');
            }
        },
        {
            text: t`Receive`,
            type: 'button',
            onClick: () => {
                console.log('Open receive modal');
            }
        },
        {
            text: t`Logout`,
            type: 'button',
            onClick: () => {
                logout()
            }
        },
        {
            text: t`Send notification`,
            type: 'button',
            onClick: () => {
                notification({ text: 'hello!' })
            }
        },
        {
            text: t`Summary`,
            link: '/summary',
            list: [
                {
                    text: t`Accounts`,
                    type: 'text',
                    list: [
                        {
                            text: 'Bitcoin',
                            link: '/accounts/bitcoin-id'
                        },
                        {
                            text: 'Ethereum',
                            link: '/accounts/ethereum-id'
                        }
                    ]
                },
                {
                    text: t`Tokens`,
                    type: 'text',
                    list: [
                        {
                            text: 'Proton Token',
                            link: '/tokens/token-id'
                        }
                    ]
                }
            ]
        },
        {
            text: t`Transactions`,
            link: '/transactions'
        },
        {
            text: t`Invoices`,
            type: 'text',
            list: [
                {
                    text: t`Sent`,
                    link: '/invoices/sent'
                },
                {
                    text: t`Received`,
                    link: '/invoices/received'
                }
            ]
        }
    ];
};


const AuthLayout = ({ children, user, logout, notification }) => {
    const getSidebar = (path) => {
        if (path === 'settings') {
            return <Sidebar list={getSettingsSidebar()}/>
        }
        return <Sidebar list={getMainSidebar(logout, notification)}/>
    };

    return (
        <>
            <Header user={user}/>
            <div className="flex flex-nowrap">
                <Route path='/:path' render={({ match }) => {
                    return getSidebar(match.params.path);
                }}/>
                <main className="main flex-item-fluid main-area">{children}</main>
            </div>
        </>
    );
};

AuthLayout.propTypes = {
    children: PropTypes.node.isRequired
};

export default AuthLayout;
