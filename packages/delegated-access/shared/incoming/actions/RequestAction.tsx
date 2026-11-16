import { useEffect, useState } from 'react';

import { useIncomingController } from '@proton/account/delegatedAccess/shared/IncomingDelegatedAccessProvider';
import type { EnrichedIncomingDelegatedAccess } from '@proton/account/delegatedAccess/shared/incoming/interface';
import useModalState from '@proton/components/components/modalTwo/useModalState';

import { RequestIncomingEmergencyContactModal } from '../../../emergencyContact/incoming/modals/RequestIncomingEmergencyContactModal';

export const RequestAction = () => {
    const [modal, setOpen, renderModal] = useModalState();
    const { subscribe } = useIncomingController();

    const [tmpIncomingDelegatedAccess, setTmpIncomingDelegatedAccess] =
        useState<EnrichedIncomingDelegatedAccess | null>(null);

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
                <RequestIncomingEmergencyContactModal
                    {...modal}
                    value={tmpIncomingDelegatedAccess}
                    onExit={() => {
                        modal.onExit();
                        setTmpIncomingDelegatedAccess(null);
                    }}
                />
            )}
        </>
    );
};
