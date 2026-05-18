import { Suspense, lazy, useEffect, useState } from 'react';

import type { ApiModalPayload } from '@proton/components/containers/api/ApiModals.interface';
import type { ApiListenerCallback, ApiMissingScopeEvent, ApiWithListener } from '@proton/shared/lib/api/createApi';
import remove from '@proton/utils/remove';
import replace from '@proton/utils/replace';

const PassScopeModal = lazy(
    () =>
        import(
            /* webpackChunkName: "pass-scope-modal" */
            './PassScopeModal'
        )
);

export const PassScopeApiModal = ({ api }: { api: ApiWithListener }) => {
    const [passScopeModals, setPassScopeModals] = useState<ApiModalPayload<ApiMissingScopeEvent['payload']>[]>([]);

    useEffect(() => {
        const handleEvent: ApiListenerCallback = (event) => {
            if (event.type === 'missing-scopes') {
                const payload = event.payload;
                const { scopes } = payload;
                if (scopes.includes('pass')) {
                    setPassScopeModals((prev) => [...prev, { open: true, payload }]);
                    return true;
                }
            }
            return false;
        };
        api.addEventListener(handleEvent);
        return () => {
            api.removeEventListener(handleEvent);
        };
    }, [api]);

    const passScopeModal = passScopeModals[0];

    return (
        passScopeModal && (
            <Suspense fallback={null}>
                <PassScopeModal
                    open={passScopeModal.open}
                    onSuccess={() => {
                        return passScopeModal.payload.resolve(
                            api({ ...passScopeModal.payload.options, output: 'raw' })
                        );
                    }}
                    onCancel={() => {
                        passScopeModal.payload.error.cancel = true;
                        passScopeModal.payload.reject(passScopeModal.payload.error);
                    }}
                    onClose={() => {
                        setPassScopeModals((arr) => replace(arr, passScopeModal, { ...passScopeModal, open: false }));
                    }}
                    onExit={() => {
                        setPassScopeModals((arr) => remove(arr, passScopeModal));
                    }}
                />
            </Suspense>
        )
    );
};
