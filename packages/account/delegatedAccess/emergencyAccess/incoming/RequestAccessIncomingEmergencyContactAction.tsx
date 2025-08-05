import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import noop from '@proton/utils/noop';

import { requestDelegatedAccessThunk } from '../../incomingActions';
import { useDispatch } from '../../useDispatch';
import { useIncomingController } from './IncomingController';
import { RequestAccessIncomingEmergencyContactModal } from './RequestAccessIncomingEmergencyContactModal';
import type { EnrichedIncomingDelegatedAccess } from './interface';

export const RequestAccessIncomingEmergencyContactAction = () => {
    const [modal, setOpen, renderModal] = useModalState();
    const { subscribe } = useIncomingController();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const [loading, setLoading] = useState(false);

    const [tmpIncomingDelegatedAccess, setTmpIncomingDelegatedAccess] =
        useState<EnrichedIncomingDelegatedAccess | null>(null);

    const action = useCallback(async ({ incomingDelegatedAccess }: NonNullable<typeof tmpIncomingDelegatedAccess>) => {
        try {
            setLoading(true);
            await dispatch(
                requestDelegatedAccessThunk({
                    id: incomingDelegatedAccess.DelegatedAccessID,
                })
            );
            createNotification({ text: c('emergency_access').t`Emergency access requested` });
            modal.onClose();
        } catch (e) {
            handleError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'request-access') {
                setOpen(true);
                setTmpIncomingDelegatedAccess(payload.value);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpIncomingDelegatedAccess && (
                <RequestAccessIncomingEmergencyContactModal
                    {...modal}
                    value={tmpIncomingDelegatedAccess}
                    onRequestAccess={(value) => action(value).catch(noop)}
                    loading={loading}
                    onExit={() => {
                        modal.onExit();
                        setTmpIncomingDelegatedAccess(null);
                    }}
                />
            )}
        </>
    );
};
