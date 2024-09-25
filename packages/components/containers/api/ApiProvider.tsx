import type { ReactNode } from 'react';
import { useEffect, useReducer, useState } from 'react';

import AuthModal from '@proton/components/containers/password/AuthModal';
import type { ApiListenerCallback, ApiWithListener } from '@proton/shared/lib/api/createApi';
import { handleInvalidSession } from '@proton/shared/lib/authentication/logout';
import { UNPAID_STATE } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';

import { useAuthentication, useConfig, useModals, useNotifications } from '../../hooks';
import UnlockModal from '../login/UnlockModal';
import DelinquentModal from './DelinquentModal';
import ApiContext from './apiContext';
import ApiServerTimeContext from './apiServerTimeContext';
import ApiStatusContext, { defaultApiStatus } from './apiStatusContext';
import HumanVerificationModal from './humanVerification/HumanVerificationModal';

const reducer = (oldState: typeof defaultApiStatus, diff: Partial<typeof defaultApiStatus>) => {
    const newState = {
        ...oldState,
        ...diff,
    };
    if (isDeepEqual(oldState, newState)) {
        return oldState;
    }
    return newState;
};

const ApiProvider = ({ api, children }: { api: ApiWithListener; children: ReactNode }) => {
    const { APP_NAME } = useConfig();
    const { createNotification } = useNotifications();
    const authentication = useAuthentication();
    const { createModal } = useModals();
    const [apiStatus, setApiStatus] = useReducer(reducer, defaultApiStatus);
    const [apiServerTime, setApiServerTime] = useState<Date | undefined>(undefined);

    useEffect(() => {
        setApiStatus(defaultApiStatus);

        const handleEvent: ApiListenerCallback = (event) => {
            if (event.type === 'notification') {
                createNotification(event.payload);
            }

            if (event.type === 'missing-scopes') {
                const { scopes, error, options, resolve, reject } = event.payload;
                if (scopes.includes('nondelinquent')) {
                    createModal(
                        <DelinquentModal
                            // When the API returns a nondelinquent scope the user is in the NO_RECEIVE variant
                            delinquent={UNPAID_STATE.NO_RECEIVE}
                            onClose={() => {
                                error.cancel = true;
                                reject(error);
                            }}
                        />
                    );
                    return;
                }

                if (scopes.includes('locked')) {
                    createModal(
                        <UnlockModal
                            onCancel={() => {
                                error.cancel = true;
                                reject(error);
                            }}
                            onSuccess={() => {
                                if (!api) {
                                    reject(error);
                                    return;
                                }
                                return resolve(api({ ...options, output: 'raw' }));
                            }}
                        />
                    );
                    return;
                }

                if (scopes.includes('password')) {
                    createModal(
                        <AuthModal
                            config={options}
                            onCancel={() => {
                                error.cancel = true;
                                reject(error);
                            }}
                            onError={(apiError) => {
                                reject(apiError);
                            }}
                            onSuccess={(result) => resolve(result.response)}
                        />
                    );
                    return;
                }

                reject(error);
            }

            if (event.type === 'handle-verification') {
                const { resolve, reject, token, methods, onVerify, title, error } = event.payload;
                createModal(
                    <HumanVerificationModal
                        title={title}
                        token={token}
                        methods={methods}
                        onVerify={onVerify}
                        onSuccess={resolve}
                        onError={reject}
                        onClose={() => {
                            error.cancel = true;
                            reject(error);
                        }}
                    />
                );
            }

            if (event.type === 'server-time') {
                setApiServerTime(event.payload);
            }

            if (event.type === 'status') {
                setApiStatus(event.payload);
            }

            if (event.type === 'logout') {
                handleInvalidSession({ appName: APP_NAME, authentication });
            }
        };
        api.addEventListener(handleEvent);
        return () => {
            api.removeEventListener(handleEvent);
        };
    }, [api]);

    return (
        <ApiContext.Provider value={api}>
            <ApiStatusContext.Provider value={apiStatus}>
                <ApiServerTimeContext.Provider value={apiServerTime}>{children}</ApiServerTimeContext.Provider>
            </ApiStatusContext.Provider>
        </ApiContext.Provider>
    );
};

export default ApiProvider;
