import { Suspense, lazy, useEffect, useRef, useState } from 'react';

import type { ApiListenerCallback, ApiVerificationEvent } from '@proton/shared/lib/api/createApi';
import type { Api } from '@proton/shared/lib/interfaces';
import remove from '@proton/utils/remove';
import replace from '@proton/utils/replace';

import type { ApiModalPayload } from './ApiModals.interface';

const HumanVerificationModal = lazy(
    () =>
        import(
            /* webpackChunkName: "human-verification-modal" */
            './humanVerification/HumanVerificationModal'
        )
);

export interface ApiEventTarget {
    addEventListener: (cb: ApiListenerCallback) => void;
    removeEventListener: (cb: ApiListenerCallback) => void;
}

interface Props {
    // The session a challenge gets answered on
    api: Api;
    // Where that session emits its challenges
    events: ApiEventTarget;
}

const ApiModalsHV = ({ api, events }: Props) => {
    const [verificationModals, setVerificationModals] = useState<ApiModalPayload<ApiVerificationEvent['payload']>[]>(
        []
    );

    // Kept in a ref so unmount can settle whatever is still open. This host is mounted per route in
    // the public app, so a route change would otherwise leave the challenged request hanging forever.
    const verificationModalsRef = useRef(verificationModals);
    verificationModalsRef.current = verificationModals;

    useEffect(() => {
        return () => {
            verificationModalsRef.current.forEach(({ payload }) => {
                payload.error.cancel = true;
                payload.reject(payload.error);
            });
        };
    }, []);

    useEffect(() => {
        const handleEvent: ApiListenerCallback = (event) => {
            if (event.type !== 'handle-verification') {
                return false;
            }
            // Payment challenges are answered by the upsell host
            if (event.payload.methods.includes('payment')) {
                return false;
            }
            setVerificationModals((prev) => [...prev, { open: true, payload: event.payload }]);
            return true;
        };
        events.addEventListener(handleEvent);
        return () => {
            events.removeEventListener(handleEvent);
        };
    }, [events]);

    const verification = verificationModals[0];

    if (!verification) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <HumanVerificationModal
                api={api}
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
    );
};

export default ApiModalsHV;
