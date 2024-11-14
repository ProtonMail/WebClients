import { Suspense, lazy, useEffect, useState } from 'react';

import { UNPAID_STATE } from '@proton/payments';
import type {
    ApiListenerCallback,
    ApiMissingScopeEvent,
    ApiVerificationEvent,
    ApiWithListener,
} from '@proton/shared/lib/api/createApi';
import { queryUnlock } from '@proton/shared/lib/api/user';
import remove from '@proton/utils/remove';
import replace from '@proton/utils/replace';

import type { ApiModalPayload } from './ApiModals.interface';

const DelinquentModal = lazy(
    () =>
        import(
            /* webpackChunkName: "delinquent-modal" */
            /* webpackMode: "lazy" */
            /* webpackFetchPriority: "low" */
            /* webpackPrefetch: true */
            './DelinquentModal'
        )
);

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

const AuthModal = lazy(
    () =>
        import(
            /* webpackChunkName: "auth-modal" */
            /* webpackMode: "lazy" */
            /* webpackFetchPriority: "low" */
            /* webpackPrefetch: true */
            '../password/AuthModal'
        )
);

const ApiProvider = ({ api }: { api: ApiWithListener }) => {
    const [unlockModals, setUnlockModals] = useState<ApiModalPayload<ApiMissingScopeEvent['payload']>[]>([]);
    const [reauthModals, setReauthModals] = useState<ApiModalPayload<ApiMissingScopeEvent['payload']>[]>([]);
    const [delinquentModals, setDelinquentModals] = useState<ApiModalPayload<ApiMissingScopeEvent['payload']>[]>([]);
    const [verificationModals, setVerificationModals] = useState<ApiModalPayload<ApiVerificationEvent['payload']>[]>(
        []
    );

    useEffect(() => {
        const handleEvent: ApiListenerCallback = (event) => {
            if (event.type === 'missing-scopes') {
                const payload = event.payload;
                const { scopes } = payload;
                if (scopes.includes('delinquent')) {
                    setDelinquentModals((prev) => [...prev, { open: true, payload }]);
                    return true;
                } else if (scopes.includes('locked')) {
                    setUnlockModals((prev) => [...prev, { open: true, payload }]);
                    return true;
                } else if (scopes.includes('password')) {
                    setReauthModals((prev) => [...prev, { open: true, payload }]);
                    return true;
                }
                return false;
            }

            if (event.type === 'handle-verification' && event.payload.methods.includes('payment')) {
                return false;
            }

            if (event.type === 'handle-verification') {
                setVerificationModals((prev) => [...prev, { open: true, payload: event.payload }]);
                return true;
            }

            return false;
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
        <>
            {delinquent && (
                <Suspense fallback={null}>
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
                </Suspense>
            )}
            {unlock && (
                <Suspense fallback={null}>
                    <AuthModal
                        scope="locked"
                        open={unlock.open}
                        onCancel={() => {
                            unlock.payload.error.cancel = true;
                            unlock.payload.reject(unlock.payload.error);
                        }}
                        config={queryUnlock()}
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
                    <AuthModal
                        scope="password"
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
        </>
    );
};

export default ApiProvider;
