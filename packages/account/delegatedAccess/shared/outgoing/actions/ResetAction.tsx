import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';

import { RefuseOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/RefuseOutgoingEmergencyContactModal';
import { RevokeOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/RevokeOutgoingEmergencyContactModal';
import { resetDelegatedAccessThunk } from '../../../outgoingActions';
import { useDispatch } from '../../../useDispatch';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { RefuseAccessActionPayload, RevokeAccessActionPayload } from '../interface';

export const ResetAction = () => {
    const { subscribe } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] = useState<
        RefuseAccessActionPayload | RevokeAccessActionPayload | null
    >(null);

    const [loading, setLoading] = useState(false);

    const action = useCallback(async ({ type, value }: NonNullable<typeof tmpOutgoingDelegatedAccess>) => {
        try {
            setLoading(true);
            await dispatch(resetDelegatedAccessThunk({ id: value.outgoingDelegatedAccess.DelegatedAccessID }));
            if (type === 'revoke-access') {
                createNotification({ text: c('emergency_access').t`Emergency access revoked` });
            } else if (type === 'refuse-access') {
                createNotification({ text: c('emergency_access').t`Emergency access refused` });
            }
            modal.onClose?.();
        } catch (e) {
            handleError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'refuse-access' || payload.type === 'revoke-access') {
                setTmpOutgoingDelegatedAccess(payload);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpOutgoingDelegatedAccess && tmpOutgoingDelegatedAccess.type === 'revoke-access' && (
                <RevokeOutgoingEmergencyContactModal
                    value={tmpOutgoingDelegatedAccess.value}
                    loading={loading}
                    onRevoke={() => {
                        void action(tmpOutgoingDelegatedAccess);
                    }}
                    {...modal}
                />
            )}
            {renderModal && tmpOutgoingDelegatedAccess && tmpOutgoingDelegatedAccess.type === 'refuse-access' && (
                <RefuseOutgoingEmergencyContactModal
                    value={tmpOutgoingDelegatedAccess.value}
                    loading={loading}
                    onRefuse={() => {
                        void action(tmpOutgoingDelegatedAccess);
                    }}
                    {...modal}
                />
            )}
        </>
    );
};
