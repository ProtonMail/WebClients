import { Suspense, lazy, useEffect, useState } from 'react';

import type { ApiListenerCallback, ApiVerificationEvent, ApiWithListener } from '@proton/shared/lib/api/createApi';
import remove from '@proton/utils/remove';
import replace from '@proton/utils/replace';

import type { ApiModalPayload } from './ApiModals.interface';

const AccountLockedUpsellModal = lazy(
    () =>
        import(
            /* webpackChunkName: "auth-modal" */
            /* webpackMode: "lazy" */
            /* webpackFetchPriority: "low" */
            /* webpackPrefetch: true */
            '@proton/components/components/upsell/modal/AccountLockedUpsellModal'
        )
);

const ApiModalsHVUpsell = ({ api }: { api: ApiWithListener }) => {
    const [verificationModals, setVerificationModals] = useState<ApiModalPayload<ApiVerificationEvent['payload']>[]>(
        []
    );

    useEffect(() => {
        const handleEvent: ApiListenerCallback = (event) => {
            if (event.type === 'handle-verification' && event.payload.methods.includes('payment')) {
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

    const verification = verificationModals[0];

    return (
        <>
            {verification && (
                <Suspense fallback={null}>
                    <AccountLockedUpsellModal
                        open={verification.open}
                        onSubscribed={() => {
                            verification.payload.resolve(null);
                        }}
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
        </>
    );
};

export default ApiModalsHVUpsell;
