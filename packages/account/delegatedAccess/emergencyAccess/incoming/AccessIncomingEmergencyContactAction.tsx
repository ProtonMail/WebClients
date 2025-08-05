import { useCallback, useEffect, useRef, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { accessDelegatedAccessThunk } from '../../incomingActions';
import { useDispatch } from '../../useDispatch';
import AccessIncomingEmergencyContactModal from './AccessIncomingEmergencyContactModal';
import { useIncomingController } from './IncomingController';
import type { EnrichedIncomingDelegatedAccess } from './interface';

export const AccessIncomingEmergencyContactAction = ({ app }: { app: APP_NAMES }) => {
    const [modal, setOpen, renderModal] = useModalState();
    const { subscribe } = useIncomingController();
    const loadingRef = useRef(false);

    const handleError = useErrorHandler();
    const dispatch = useDispatch();

    const [tmpIncomingDelegatedAccess, setTmpIncomingDelegatedAccess] =
        useState<EnrichedIncomingDelegatedAccess | null>(null);

    const signIn = useCallback(async (value: EnrichedIncomingDelegatedAccess) => {
        // Only allow one at a time
        if (loadingRef.current) {
            return;
        }
        loadingRef.current = true;
        try {
            await dispatch(
                accessDelegatedAccessThunk({
                    incomingDelegatedAccess: value.incomingDelegatedAccess,
                })
            );
            setTmpIncomingDelegatedAccess(value);
            setOpen(true);
        } catch (e) {
            handleError(e);
        } finally {
            loadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'access') {
                signIn(payload.value).catch(noop);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpIncomingDelegatedAccess && (
                <AccessIncomingEmergencyContactModal
                    {...modal}
                    email={tmpIncomingDelegatedAccess.incomingDelegatedAccess.SourceEmail}
                    user={tmpIncomingDelegatedAccess.parsedIncomingDelegatedAccess.contact.formatted}
                    app={app}
                    onExit={() => {
                        modal.onExit();
                        setTmpIncomingDelegatedAccess(null);
                    }}
                />
            )}
        </>
    );
};
