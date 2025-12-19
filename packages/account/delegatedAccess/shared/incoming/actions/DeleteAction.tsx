import { useEffect, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';

import { DeleteIncomingEmergencyContactModal } from '../../../emergencyContact/incoming/modals/DeleteIncomingEmergencyContactModal';
import { DelegatedAccessTypeEnum } from '../../../interface';
import { useIncomingController } from '../../IncomingDelegatedAccessProvider';
import type { EnrichedIncomingDelegatedAccess } from '../interface';

export const DeleteAction = () => {
    const [modal, setOpen, renderModal] = useModalState();
    const { subscribe } = useIncomingController();

    const [tmpIncomingDelegatedAccess, setTmpIncomingDelegatedAccess] =
        useState<EnrichedIncomingDelegatedAccess | null>(null);

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
            {renderModal &&
                tmpIncomingDelegatedAccess &&
                tmpIncomingDelegatedAccess.parsedIncomingDelegatedAccess.type ===
                    DelegatedAccessTypeEnum.EmergencyAccess && (
                    <DeleteIncomingEmergencyContactModal
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
