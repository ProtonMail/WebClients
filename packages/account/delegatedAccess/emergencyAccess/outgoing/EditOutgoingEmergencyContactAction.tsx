import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';

import { editDelegatedAccessThunk } from '../../outgoingActions';
import { useDispatch } from '../../useDispatch';
import {
    EditOutgoingEmergencyContactModal,
    type EditOutgoingEmergencyContactModalProps,
} from './EditOutgoingEmergencyContactModal';
import { useOutgoingController } from './OutgoingController';
import type { EnrichedOutgoingDelegatedAccess } from './interface';

export const EditOutgoingEmergencyContactAction = () => {
    const { subscribe } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] =
        useState<EnrichedOutgoingDelegatedAccess | null>(null);

    const [loading, setLoading] = useState(false);

    const action = useCallback(async (payload: Parameters<EditOutgoingEmergencyContactModalProps['onEdit']>[0]) => {
        try {
            setLoading(true);
            await dispatch(editDelegatedAccessThunk(payload));
            createNotification({ text: c('emergency_access').t`Wait time saved` });
            modal.onClose?.();
        } catch (e) {
            handleError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'change-wait-time') {
                setTmpOutgoingDelegatedAccess(payload.value);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpOutgoingDelegatedAccess && (
                <EditOutgoingEmergencyContactModal
                    {...modal}
                    value={tmpOutgoingDelegatedAccess}
                    loading={loading}
                    onEdit={action}
                    onExit={() => {
                        modal.onExit();
                    }}
                />
            )}
        </>
    );
};
