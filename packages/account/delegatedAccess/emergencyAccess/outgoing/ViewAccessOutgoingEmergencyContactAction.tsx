import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import useSearchParamsEffect from '@proton/components/hooks/useSearchParamsEffect';

import { grantDelegatedAccessThunk, resetDelegatedAccessThunk } from '../../outgoingActions';
import { useDispatch } from '../../useDispatch';
import { useOutgoingController } from './OutgoingController';
import {
    ViewAccessOutgoingEmergencyContactModal,
    type ViewAccessOutgoingEmergencyContactModalProps,
} from './ViewAccessOutgoingEmergencyContactModal';
import type { EnrichedOutgoingDelegatedAccess } from './interface';

export const ViewAccessOutgoingEmergencyContactAction = () => {
    const { subscribe, notify, items } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] =
        useState<EnrichedOutgoingDelegatedAccess | null>(null);

    const [loading, setLoading] = useState(false);

    const action: ViewAccessOutgoingEmergencyContactModalProps['onAction'] = useCallback(async ({ type, value }) => {
        if (type === 'refuse') {
            try {
                setLoading(true);
                await dispatch(resetDelegatedAccessThunk({ id: value.outgoingDelegatedAccess.DelegatedAccessID }));
                createNotification({ text: c('emergency_access').t`Emergency access refused` });
                modal.onClose?.();
            } catch (e) {
                handleError(e);
            } finally {
                setLoading(false);
            }
        }

        if (type === 'grant') {
            try {
                setLoading(true);
                await dispatch(grantDelegatedAccessThunk(value.outgoingDelegatedAccess));
                createNotification({ text: c('emergency_access').t`Emergency access refused` });
                modal.onClose?.();
            } catch (e) {
                handleError(e);
            } finally {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'view-access') {
                setTmpOutgoingDelegatedAccess(payload.value);
                setModalOpen(true);
            }
        });
    }, []);

    useSearchParamsEffect(
        (params) => {
            if (params.get('action') === 'view') {
                const id = params.get('id');
                const item = items.find((item) => item.outgoingDelegatedAccess.DelegatedAccessID === id);
                if (item) {
                    notify({ type: 'view-access', value: item });
                }
                params.delete('id');
                params.delete('action');
                return params;
            }
        },
        [items]
    );

    return (
        <>
            {renderModal && tmpOutgoingDelegatedAccess && (
                <ViewAccessOutgoingEmergencyContactModal
                    {...modal}
                    value={tmpOutgoingDelegatedAccess}
                    loading={loading}
                    onAction={action}
                    onExit={() => {
                        setTmpOutgoingDelegatedAccess(null);
                        modal.onExit();
                    }}
                />
            )}
        </>
    );
};
