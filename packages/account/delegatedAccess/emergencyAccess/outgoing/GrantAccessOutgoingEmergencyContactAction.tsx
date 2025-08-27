import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';

import { grantDelegatedAccessThunk } from '../../outgoingActions';
import { useDispatch } from '../../useDispatch';
import { GrantAccessOutgoingEmergencyContactModal } from './GrantAccessOutgoingEmergencyContactModal';
import { useOutgoingController } from './OutgoingController';
import type { EnrichedOutgoingDelegatedAccess } from './interface';

export const GrantAccessOutgoingEmergencyContactAction = () => {
    const { subscribe } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] =
        useState<EnrichedOutgoingDelegatedAccess | null>(null);

    const [loading, setLoading] = useState(false);

    const action = useCallback(async (payload: EnrichedOutgoingDelegatedAccess) => {
        try {
            setLoading(true);
            await dispatch(grantDelegatedAccessThunk(payload.outgoingDelegatedAccess));
            createNotification({ text: c('emergency_access').t`Emergency access granted` });
            modal.onClose?.();
        } catch (e) {
            handleError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'grant-access') {
                setTmpOutgoingDelegatedAccess(payload.value);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpOutgoingDelegatedAccess && (
                <GrantAccessOutgoingEmergencyContactModal
                    {...modal}
                    value={tmpOutgoingDelegatedAccess}
                    loading={loading}
                    onGrant={action}
                    onExit={() => {
                        modal.onExit();
                    }}
                />
            )}
        </>
    );
};
