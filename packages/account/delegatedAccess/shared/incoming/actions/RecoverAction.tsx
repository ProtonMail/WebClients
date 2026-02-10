import { useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';

import { RecoverIncomingRecoveryContactModal } from '../../../recoveryContact/incoming/modals/RecoverIncomingRecoveryContactModal';
import { useIncomingController } from '../../IncomingDelegatedAccessProvider';
import type { EnrichedIncomingDelegatedAccess } from '../interface';

export const RecoverAction = () => {
    const { subscribe } = useIncomingController();
    const [modal, setModalOpen, renderModal] = useModalState();

    const [tmpIncomingDelegatedAccess, setTmpIncomingDelegatedAccess] =
        useState<EnrichedIncomingDelegatedAccess | null>(null);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'recover') {
                setTmpIncomingDelegatedAccess(payload.value);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && tmpIncomingDelegatedAccess && (
                <RecoverIncomingRecoveryContactModal {...modal} value={tmpIncomingDelegatedAccess} />
            )}
        </>
    );
};
