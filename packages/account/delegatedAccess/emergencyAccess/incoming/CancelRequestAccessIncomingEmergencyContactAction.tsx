import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import noop from '@proton/utils/noop';

import { resetDelegatedAccessThunk } from '../../incomingActions';
import { useDispatch } from '../../useDispatch';
import { CancelRequestAccessIncomingEmergencyContactModal } from './CancelRequestAccessIncomingEmergencyContactModal';
import { useIncomingController } from './IncomingController';
import type { EnrichedIncomingDelegatedAccess } from './interface';

export const CancelRequestAccessIncomingEmergencyContactAction = () => {
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
            await dispatch(resetDelegatedAccessThunk({ id: incomingDelegatedAccess.DelegatedAccessID }));
            createNotification({ text: c('emergency_access').t`Access request canceled` });
            modal.onClose();
        } catch (e) {
            handleError(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'cancel-request-access') {
                setOpen(true);
                setTmpIncomingDelegatedAccess(payload.value);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpIncomingDelegatedAccess && (
                <CancelRequestAccessIncomingEmergencyContactModal
                    {...modal}
                    value={tmpIncomingDelegatedAccess}
                    onCancel={(value) => {
                        action(value).catch(noop);
                    }}
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
