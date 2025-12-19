import { useEffect, useMemo, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';

import { useAddresses } from '../../../../addresses/hooks';
import { useProtonDomains } from '../../../../protonDomains/hooks';
import { CreateOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/CreateOutgoingEmergencyContactModal';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { AddActionPayload } from '../interface';

export const CreateAction = () => {
    const { subscribe, items } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();
    const [actionPayload, setActionPayload] = useState<AddActionPayload['value'] | null>(null);

    const [addresses] = useAddresses();
    const [contactEmails] = useContactEmails();
    const [{ protonDomains, premiumDomains }] = useProtonDomains();
    const domains = useMemo(() => {
        return new Set([...protonDomains, ...premiumDomains]);
    }, [protonDomains, premiumDomains]);

    const existingOutgoingTargetEmails = useMemo(() => {
        const emergencyContacts = new Set(
            items.emergencyContacts.map((value) => value.outgoingDelegatedAccess.TargetEmail)
        );
        return {
            emergencyContacts,
        };
    }, [items]);

    useEffect(() => {
        return subscribe((payload) => {
            if (payload.type === 'add') {
                setActionPayload(payload.value);
                setModalOpen(true);
            }
        });
    }, []);

    return (
        <>
            {renderModal && actionPayload === 'emergency-contact' && (
                <CreateOutgoingEmergencyContactModal
                    {...modal}
                    addresses={addresses}
                    protonDomains={domains}
                    contactEmails={contactEmails}
                    existingOutgoingTargetEmails={existingOutgoingTargetEmails.emergencyContacts}
                    onExit={() => {
                        modal.onExit();
                        setActionPayload(null);
                    }}
                />
            )}
        </>
    );
};
