import { useEffect, useMemo, useState } from 'react';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useContactEmails } from '@proton/mail/store/contactEmails/hooks';

import { useAddresses } from '../../../../addresses/hooks';
import { useProtonDomains } from '../../../../protonDomains/hooks';
import { useUser } from '../../../../user/hooks';
import { CreateOutgoingEmergencyContactModal } from '../../../emergencyContact/outgoing/modals/CreateOutgoingEmergencyContactModal';
import { CreateOutgoingRecoveryContactModal } from '../../../recoveryContact/outgoing/modals/CreateOutgoingRecoveryContactModal';
import { useOutgoingController } from '../../OutgoingDelegatedAccessProvider';
import type { AddActionPayload } from '../interface';

export const CreateAction = () => {
    const { subscribe, items } = useOutgoingController();
    const [modal, setModalOpen, renderModal] = useModalState();
    const [actionPayload, setActionPayload] = useState<AddActionPayload['value'] | null>(null);

    const [user] = useUser();
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
        const recoveryContacts = new Set(
            items.recoveryContacts.map((value) => value.outgoingDelegatedAccess.TargetEmail)
        );
        return {
            emergencyContacts,
            recoveryContacts,
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
            {renderModal && actionPayload === 'recovery-contact' && (
                <CreateOutgoingRecoveryContactModal
                    {...modal}
                    addresses={addresses}
                    protonDomains={domains}
                    contactEmails={contactEmails}
                    existingOutgoingTargetEmails={existingOutgoingTargetEmails.recoveryContacts}
                    email={user.Email}
                    onExit={() => {
                        modal.onExit();
                        setActionPayload(null);
                    }}
                />
            )}
        </>
    );
};
