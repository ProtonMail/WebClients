import React, { useState, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import createAuthentication from 'proton-shared/lib/authenticationStore';
import createCache from 'proton-shared/lib/helpers/cache';
import { formatUser, UserModel } from 'proton-shared/lib/models/userModel';
import { STATUS } from 'proton-shared/lib/models/cache';

import CompatibilityCheck from './CompatibilityCheck';
import Icons from '../../components/icon/Icons';
import useInstance from '../../hooks/useInstance';
import ConfigProvider from '../config/Provider';
import NotificationsProvider from '../notifications/Provider';
import ModalsProvider from '../modals/Provider';
import ApiProvider from '../api/ApiProvider';
import CacheProvider from '../cache/Provider';
import AuthenticationProvider from '../authentication/Provider';
import PublicApiProvider from '../api/PublicApiProvider';
import { RightToLeftProvider } from '../..';

const ProtonApp = ({ storage, config, children }) => {
    const authentication = useInstance(() => createAuthentication(storage));
    const cacheRef = useRef();
    const [UID, setUID] = useState(() => authentication.getUID());
    const tempDataRef = useRef({});

    if (UID && !cacheRef.current) {
        cacheRef.current = createCache();
    }

    const handleLogin = useCallback(
        ({ authResult: { UID: newUID, EventID }, credentials: { keyPassword }, userResult: user }) => {
            authentication.setUID(newUID);
            authentication.setPassword(keyPassword);

            const cache = createCache();

            // If the user was received from the login call, pre-set it directly.
            user &&
                cache.set(UserModel.key, {
                    value: formatUser(user),
                    status: STATUS.RESOLVED
                });
            cache.set('tmp', { eventID: EventID });

            cacheRef.current = cache;

            setUID(newUID);
        },
        []
    );

    const handleLogout = useCallback(() => {
        authentication.setUID();
        authentication.setPassword();

        setUID();

        tempDataRef.current = {};
        cacheRef.current = undefined;
    }, []);

    const authenticationValue = useMemo(() => {
        if (!UID) {
            return {
                login: handleLogin
            };
        }
        return {
            UID,
            ...authentication,
            login: handleLogin,
            logout: handleLogout
        };
    }, [UID]);

    return (
        <CompatibilityCheck>
            <Icons />
            <ConfigProvider config={config}>
                <RightToLeftProvider>
                    {UID ? (
                        <React.Fragment key={UID}>
                            <NotificationsProvider>
                                <ModalsProvider>
                                    <ApiProvider UID={UID} config={config} onLogout={handleLogout}>
                                        <AuthenticationProvider store={authenticationValue}>
                                            <CacheProvider cache={cacheRef.current}>{children}</CacheProvider>
                                        </AuthenticationProvider>
                                    </ApiProvider>
                                </ModalsProvider>
                            </NotificationsProvider>
                        </React.Fragment>
                    ) : (
                        <NotificationsProvider>
                            <ModalsProvider>
                                <PublicApiProvider config={config}>
                                    <AuthenticationProvider store={authenticationValue}>
                                        {children}
                                    </AuthenticationProvider>
                                </PublicApiProvider>
                            </ModalsProvider>
                        </NotificationsProvider>
                    )}
                </RightToLeftProvider>
            </ConfigProvider>
        </CompatibilityCheck>
    );
};

ProtonApp.propTypes = {
    storage: PropTypes.shape({
        set: PropTypes.func,
        get: PropTypes.func
    }).isRequired,
    config: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired
};

export default ProtonApp;
