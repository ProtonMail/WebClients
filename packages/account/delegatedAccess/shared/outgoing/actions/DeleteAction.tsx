import { useCallback, useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';

import { DeleteOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/DeleteOutgoingEmergencyContactModal';
import { DelegatedAccessTypeEnum } from '../../../interface';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { EnrichedOutgoingDelegatedAccess } from '../interface';

export const DeleteAction = () => {
    const [modal, setOpen, renderModal] = useModalState();
    const { subscribe } = useOutgoingController();

    const [tmpOutgoingDelegatedAccess, setTmpOutgoingDelegatedAccess] =
        useState<EnrichedOutgoingDelegatedAccess | null>(null);

    const confirm = useCallback((outgoingDelegatedAccess: EnrichedOutgoingDelegatedAccess) => {
        setTmpOutgoingDelegatedAccess(outgoingDelegatedAccess);
        setOpen(true);
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
            {renderModal &&
                tmpOutgoingDelegatedAccess &&
                tmpOutgoingDelegatedAccess.parsedOutgoingDelegatedAccess.type ===
                    DelegatedAccessTypeEnum.EmergencyAccess && (
                    <DeleteOutgoingEmergencyContactModal
                        {...modal}
                        value={tmpOutgoingDelegatedAccess}
                        onExit={() => {
                            modal.onExit();
                            setTmpOutgoingDelegatedAccess(null);
                        }}
                    />
                )}
        </>
    );
};
