import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import noop from '@proton/utils/noop';

import { deleteDelegatedAccessThunk } from '../../outgoingActions';
import { DeleteOutgoingEmergencyContactModal } from './DeleteOutgoingEmergencyContactModal';
import { useOutgoingController } from './OutgoingController';
import type { EnrichedOutgoingDelegatedAccess } from './interface';

export const DeleteOutgoingEmergencyContactAction = () => {
    const [modal, setOpen, renderModal] = useModalState();
    const { subscribe } = useOutgoingController();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const [loading, setLoading] = useState(false);

    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] =
        useState<EnrichedOutgoingDelegatedAccess | null>(null);

    const confirm = useCallback((outgoingDelegatedAccess: EnrichedOutgoingDelegatedAccess) => {
        setTmpOutgoingDelegatedAccess(outgoingDelegatedAccess);
        setOpen(true);
    }, []);

    const action = useCallback(async (value: EnrichedOutgoingDelegatedAccess) => {
        setLoading(true);
        try {
            await dispatch(deleteDelegatedAccessThunk({ id: value.outgoingDelegatedAccess.DelegatedAccessID }));
            createNotification({ text: c('emergency_access').t`Emergency contact removed` });
            modal.onClose();
        } catch (e) {
            handleError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'delete') {
                confirm(payload.value);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpOutgoingDelegatedAccess && (
                <DeleteOutgoingEmergencyContactModal
                    {...modal}
                    value={tmpOutgoingDelegatedAccess}
                    onRemove={(value) => {
                        action(value).catch(noop);
                    }}
                    loading={loading}
                    onExit={() => {
                        modal.onExit();
                        setTmpOutgoingDelegatedAccess(null);
                    }}
                />
            )}
        </>
    );
};
