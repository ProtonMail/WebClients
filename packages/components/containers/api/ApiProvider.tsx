import { type ReactNode } from 'react';
import { Suspense, lazy, useEffect, useReducer, useState } from 'react';

import useAuthentication from '@proton/components/hooks/useAuthentication';
import useConfig from '@proton/components/hooks/useConfig';
import useNotifications from '@proton/components/hooks/useNotifications';
import type {
    ApiListenerCallback,
    ApiMissingScopeEvent,
    ApiVerificationEvent,
    ApiWithListener,
} from '@proton/shared/lib/api/createApi';
import { handleInvalidSession } from '@proton/shared/lib/authentication/logout';
import { UNPAID_STATE } from '@proton/shared/lib/constants';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import remove from '@proton/utils/remove';
import replace from '@proton/utils/replace';

import DelinquentModal from './DelinquentModal';
import ApiContext from './apiContext';
import ApiServerTimeContext from './apiServerTimeContext';
import ApiStatusContext, { defaultApiStatus } from './apiStatusContext';

const HumanVerificationModal = lazy(
    () =>
        import(
            /* webpackChunkName: "human-verification-modal" */
            /* webpackMode: "lazy" */
            /* webpackFetchPriority: "low" */
            /* webpackPrefetch: true */
            './humanVerification/HumanVerificationModal'
        )
);

const AuthModalContainer = lazy(
    () =>
        import(
            /* webpackChunkName: "auth-modal" */
            /* webpackMode: "lazy" */
            /* webpackFetchPriority: "low" */
            /* webpackPrefetch: true */
            '../password/AuthModalContainer'
        )
);

const UnlockModal = lazy(
    () =>
        import(
            /* webpackChunkName: "unlock-modal" */
            /* webpackMode: "lazy" */
            /* webpackFetchPriority: "low" */
            /* webpackPrefetch: true */
            '../login/UnlockModal'
        )
);

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

type ModalPayload<T> = {
    payload: T;
    open: boolean;
};

const ApiProvider = ({ api, children }: { api: ApiWithListener; children: ReactNode }) => {
    const { APP_NAME } = useConfig();
    const { createNotification } = useNotifications();
    const authentication = useAuthentication();
    const [apiStatus, setApiStatus] = useReducer(reducer, defaultApiStatus);
    const [apiServerTime, setApiServerTime] = useState<Date | undefined>(undefined);

    const [unlockModals, setUnlockModals] = useState<ModalPayload<ApiMissingScopeEvent['payload']>[]>([]);
    const [reauthModals, setReauthModals] = useState<ModalPayload<ApiMissingScopeEvent['payload']>[]>([]);
    const [delinquentModals, setDelinquentModals] = useState<ModalPayload<ApiMissingScopeEvent['payload']>[]>([]);
    const [verificationModals, setVerificationModals] = useState<ModalPayload<ApiVerificationEvent['payload']>[]>([]);

    useEffect(() => {
        setApiStatus(defaultApiStatus);

        const handleEvent: ApiListenerCallback = (event) => {
            if (event.type === 'notification') {
                createNotification(event.payload);
            }

            if (event.type === 'missing-scopes') {
                const payload = event.payload;
                const { scopes, error, reject } = payload;
                if (scopes.includes('delinquent')) {
                    setDelinquentModals((prev) => [...prev, { open: true, payload }]);
                } else if (scopes.includes('locked')) {
                    setUnlockModals((prev) => [...prev, { open: true, payload }]);
                } else if (scopes.includes('password')) {
                    setReauthModals((prev) => [...prev, { open: true, payload }]);
                } else {
                    reject(error);
                }
            }

            if (event.type === 'handle-verification') {
                setVerificationModals((prev) => [...prev, { open: true, payload: event.payload }]);
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

    const delinquent = delinquentModals[0];
    const reauth = reauthModals[0];
    const unlock = unlockModals[0];
    const verification = verificationModals[0];

    return (
        <ApiContext.Provider value={api}>
            <ApiStatusContext.Provider value={apiStatus}>
                <ApiServerTimeContext.Provider value={apiServerTime}>
                    {children}
                    {delinquent && (
                        <DelinquentModal
                            open={delinquent.open}
                            // When the API returns a nondelinquent scope the user is in the NO_RECEIVE variant
                            delinquent={UNPAID_STATE.NO_RECEIVE}
                            onClose={() => {
                                delinquent.payload.error.cancel = true;
                                delinquent.payload.reject(delinquent.payload.error);
                                setDelinquentModals((arr) => replace(arr, delinquent, { ...delinquent, open: false }));
                            }}
                            onExit={() => {
                                setDelinquentModals((arr) => remove(arr, delinquent));
                            }}
                        />
                    )}
                    {unlock && (
                        <Suspense fallback={null}>
                            <UnlockModal
                                open={unlock.open}
                                onCancel={() => {
                                    unlock.payload.error.cancel = true;
                                    unlock.payload.reject(unlock.payload.error);
                                }}
                                onSuccess={() => {
                                    if (!api) {
                                        unlock.payload.reject(unlock.payload.error);
                                        return;
                                    }
                                    return unlock.payload.resolve(
                                        api({
                                            ...unlock.payload.options,
                                            output: 'raw',
                                        })
                                    );
                                }}
                                onClose={() => {
                                    setUnlockModals((arr) => replace(arr, unlock, { ...unlock, open: false }));
                                }}
                                onExit={() => {
                                    setUnlockModals((arr) => remove(arr, unlock));
                                }}
                            />
                        </Suspense>
                    )}
                    {verification && (
                        <Suspense fallback={null}>
                            <HumanVerificationModal
                                open={verification.open}
                                title={verification.payload.title}
                                token={verification.payload.token}
                                methods={verification.payload.methods}
                                onVerify={verification.payload.onVerify}
                                onSuccess={verification.payload.resolve}
                                onError={verification.payload.reject}
                                onClose={() => {
                                    verification.payload.error.cancel = true;
                                    verification.payload.reject(verification.payload.error);
                                    setVerificationModals((arr) =>
                                        replace(arr, verification, {
                                            ...verification,
                                            open: false,
                                        })
                                    );
                                }}
                                onExit={() => {
                                    setVerificationModals((arr) => remove(arr, verification));
                                }}
                            />
                        </Suspense>
                    )}
                    {reauth && (
                        <Suspense fallback={null}>
                            <AuthModalContainer
                                open={reauth.open}
                                config={reauth.payload.options}
                                onCancel={() => {
                                    reauth.payload.error.cancel = true;
                                    reauth.payload.reject(reauth.payload.error);
                                }}
                                onError={(apiError) => {
                                    reauth.payload.reject(apiError);
                                }}
                                onSuccess={(result) => reauth.payload.resolve(result.response)}
                                onClose={() => {
                                    setReauthModals((arr) => replace(arr, reauth, { ...reauth, open: false }));
                                }}
                                onExit={() => {
                                    setReauthModals((arr) => remove(arr, reauth));
                                }}
                            />
                        </Suspense>
                    )}
                </ApiServerTimeContext.Provider>
            </ApiStatusContext.Provider>
        </ApiContext.Provider>
    );
};

export default ApiProvider;
