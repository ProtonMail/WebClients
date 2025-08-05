import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import noop from '@proton/utils/noop';

import { deleteDelegatedAccessThunk } from '../../incomingActions';
import { useDispatch } from '../../useDispatch';
import { DeleteIncomingEmergencyContactModal } from './DeleteIncomingEmergencyContactModal';
import { useIncomingController } from './IncomingController';
import type { EnrichedIncomingDelegatedAccess } from './interface';

export const DeleteIncomingEmergencyContactAction = () => {
    const [modal, setOpen, renderModal] = useModalState();
    const { subscribe } = useIncomingController();

    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();

    const [loading, setLoading] = useState(false);

    const [tmpIncomingDelegatedAccess, setTmpIncomingDelegatedAccess] =
        useState<EnrichedIncomingDelegatedAccess | null>(null);

    const action = useCallback(
        async ({
            incomingDelegatedAccess,
            parsedIncomingDelegatedAccess,
        }: NonNullable<typeof tmpIncomingDelegatedAccess>) => {
            try {
                setLoading(true);
                await dispatch(deleteDelegatedAccessThunk({ id: incomingDelegatedAccess.DelegatedAccessID }));
                const user = parsedIncomingDelegatedAccess.contact.formatted;
                createNotification({ text: c('emergency_access').t`Emergency access for ${user} removed` });
                modal.onClose();
            } catch (e) {
                handleError(e);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'delete') {
                setOpen(true);
                setTmpIncomingDelegatedAccess(payload.value);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpIncomingDelegatedAccess && (
                <DeleteIncomingEmergencyContactModal
                    {...modal}
                    value={tmpIncomingDelegatedAccess}
                    onDelete={(value) => {
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
